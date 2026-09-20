import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';
import { analyzePackagingText } from '../services/rulesEngine.js';

/**
 * @desc    Analyze uploaded product image with Sharp preprocessing, Tesseract OCR, and 2011 Rules Engine
 * @route   POST /api/scanner/analyze
 * @access  Public / Protected
 */
export const analyzeProductImage = async (req, res, next) => {
  let worker = null;
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a product image file (multipart/form-data) or base64 image',
      });
    }

    // 1. Resolve image source: Buffer from multer or base64 data URI
    let imageSource;
    if (req.file) {
      imageSource = req.file.buffer;
    } else if (req.body.image) {
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      imageSource = Buffer.from(base64Data, 'base64');
    }

    // 2. Pre-process image with sharp:
    //    - ONLY apply grayscale and normalization to remove packaging color noise and maximize contrast
    //    - Preserve 100% of original dimensions and aspect ratio (NO resizing, NO cropping)
    let processedBuffer = imageSource;
    try {
      processedBuffer = await sharp(imageSource)
        .rotate()
        .grayscale()
        .normalize()
        .toBuffer();
    } catch (sharpError) {
      console.warn('[Sharp Preprocessing Warning]: Falling back to original image buffer:', sharpError.message);
      processedBuffer = imageSource;
    }

    // 3. Initialize Tesseract OCR worker with optimal Page Segmentation Mode (PSM)
    //    PSM 4 (SINGLE_COLUMN): Assumes a single column of text of variable sizes.
    //    This scans the entire label from top to bottom, preventing truncation of bottom blocks
    worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN, // PSM 4
    });

    // 4. Perform OCR recognition on enhanced image buffer
    let ret = await worker.recognize(processedBuffer);
    let extractedText = ret.data && ret.data.text ? String(ret.data.text) : '';
    let confidence = ret.data && typeof ret.data.confidence === 'number' ? ret.data.confidence : 0;

    // If PSM 4 yields sparse text or low confidence, retry with PSM 11 (SPARSE_TEXT)
    if (confidence < 50 || extractedText.trim().length < 25) {
      try {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT, // PSM 11
        });
        const fallbackRet = await worker.recognize(processedBuffer);
        const fallbackText = fallbackRet.data && fallbackRet.data.text ? String(fallbackRet.data.text) : '';
        const fallbackConfidence =
          fallbackRet.data && typeof fallbackRet.data.confidence === 'number' ? fallbackRet.data.confidence : 0;

        if (fallbackConfidence > confidence || fallbackText.trim().length > extractedText.trim().length) {
          ret = fallbackRet;
          extractedText = fallbackText;
          confidence = fallbackConfidence;
        }
      } catch (psmFallbackErr) {
        console.warn('[Tesseract PSM Fallback Warning]:', psmFallbackErr.message);
      }
    }

    // 5. Terminate worker to free memory
    await worker.terminate();
    worker = null;

    const trimmedText = extractedText.trim();
    const alphanumericChars = trimmedText.replace(/[^a-zA-Z0-9]/g, '');
    const alphanumericRatio = trimmedText.length > 0 ? alphanumericChars.length / trimmedText.length : 0;

    // Reject blurry, unreadable, or gibberish images
    const isBlurryOrUnreadable =
      confidence < 45 ||
      alphanumericChars.length < 8 ||
      (trimmedText.length >= 10 && alphanumericRatio < 0.35);

    if (isBlurryOrUnreadable) {
      return res.status(400).json({
        success: false,
        error: 'Image is blurry or unreadable. Please ensure good lighting, no reflections, and try again.',
        message: 'Image is blurry or unreadable. Please ensure good lighting, no reflections, and try again.',
        ocrConfidence: `${Math.round(confidence)}%`,
        extractedLength: trimmedText.length,
      });
    }

    // 6. Evaluate real extracted text against 2011 Legal Metrology Rules with 3-mode matrix
    const evaluation = analyzePackagingText(trimmedText, confidence);

    return res.status(200).json({
      success: true,
      message: 'OCR analysis completed successfully',
      extractedText: trimmedText,
      rawOcrText: trimmedText,
      ocrConfidence: `${Math.round(confidence)}%`,
      confidence,
      complianceStatus: evaluation.complianceStatus,
      evaluation,
    });
  } catch (error) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    console.error('[Scanner Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'OCR processing failed on server',
    });
  }
};

/**
 * @desc    Re-analyze image with Sharp contrast enhancement and crop coordinates
 * @route   POST /api/scanner/reanalyze
 * @access  Public / Protected
 */
export const reanalyzeProductImage = async (req, res, next) => {
  let worker = null;
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image file or base64 string for re-analysis',
      });
    }

    // 1. Resolve image source: Buffer from multer or base64 data URI
    let imageSource;
    if (req.file) {
      imageSource = req.file.buffer;
    } else if (req.body.image) {
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      imageSource = Buffer.from(base64Data, 'base64');
    }

    // 2. Parse crop coordinates if provided (object or JSON string)
    let crop = req.body.crop;
    if (typeof crop === 'string') {
      try {
        crop = JSON.parse(crop);
      } catch {
        crop = null;
      }
    }

    // Contrast & filter parameters
    const contrastMultiplier = Number(req.body.contrast) || 1.35;
    const isSharpenEnabled = req.body.sharpen !== false && req.body.sharpen !== 'false';
    const isThresholdEnabled = Boolean(req.body.threshold);
    const thresholdVal = Number(req.body.threshold) || 128;

    // 3. Sharp image processing pipeline
    let pipeline = sharp(imageSource).rotate();
    const metadata = await pipeline.metadata();

    // Apply crop if valid coordinates within image bounds
    if (crop && typeof crop === 'object') {
      const left = Math.max(0, Math.round(Number(crop.left ?? crop.x) || 0));
      const top = Math.max(0, Math.round(Number(crop.top ?? crop.y) || 0));
      let width = Math.round(Number(crop.width) || 0);
      let height = Math.round(Number(crop.height) || 0);

      const maxW = metadata.width || 2000;
      const maxH = metadata.height || 2000;

      if (!width || left + width > maxW) {
        width = Math.max(20, maxW - left);
      }
      if (!height || top + height > maxH) {
        height = Math.max(20, maxH - top);
      }

      if (width > 20 && height > 20 && left < maxW && top < maxH) {
        pipeline = pipeline.extract({ left, top, width, height });
      }
    }

    // Convert to grayscale for OCR contrast
    pipeline = pipeline.grayscale();

    // Apply contrast linear stretching
    if (contrastMultiplier !== 1) {
      pipeline = pipeline.linear(contrastMultiplier, -(128 * contrastMultiplier) + 128);
    }

    // Normalize contrast
    pipeline = pipeline.normalize();

    // Optional threshold binarization
    if (isThresholdEnabled) {
      pipeline = pipeline.threshold(thresholdVal);
    }

    // Apply sharpen filter
    if (isSharpenEnabled) {
      pipeline = pipeline.sharpen();
    }

    const processedBuffer = await pipeline.toBuffer();

    // 4. Run Tesseract OCR on enhanced & cropped buffer
    worker = await createWorker('eng');
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_COLUMN, // PSM 4
    });

    let ret = await worker.recognize(processedBuffer);
    let extractedText = ret.data && ret.data.text ? String(ret.data.text) : '';
    let confidence = ret.data && typeof ret.data.confidence === 'number' ? ret.data.confidence : 0;

    // PSM 11 fallback for sparse text blocks
    if (confidence < 50 || extractedText.trim().length < 20) {
      try {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SPARSE_TEXT, // PSM 11
        });
        const fallbackRet = await worker.recognize(processedBuffer);
        const fallbackText = fallbackRet.data && fallbackRet.data.text ? String(fallbackRet.data.text) : '';
        const fallbackConfidence =
          fallbackRet.data && typeof fallbackRet.data.confidence === 'number' ? fallbackRet.data.confidence : 0;

        if (fallbackConfidence > confidence || fallbackText.trim().length > extractedText.trim().length) {
          ret = fallbackRet;
          extractedText = fallbackText;
          confidence = fallbackConfidence;
        }
      } catch (fallbackErr) {
        console.warn('[Re-analysis PSM Fallback Warning]:', fallbackErr.message);
      }
    }

    await worker.terminate();
    worker = null;

    const trimmedText = extractedText.trim();

    // 5. Evaluate extracted text with 3-mode Legal Metrology engine
    const evaluation = analyzePackagingText(trimmedText, confidence);

    const reanalysisCount = (Number(req.body.reanalysisCount) || 0) + 1;

    return res.status(200).json({
      success: true,
      message: 'Re-analysis with Sharp enhancements and OCR completed successfully',
      extractedText: trimmedText,
      rawOcrText: trimmedText,
      ocrConfidence: `${Math.round(confidence)}%`,
      confidence,
      complianceStatus: evaluation.complianceStatus,
      evaluation,
      reanalysisCount,
      appliedFilters: {
        crop: crop || null,
        contrast: contrastMultiplier,
        sharpen: isSharpenEnabled,
        threshold: isThresholdEnabled ? thresholdVal : null,
      },
      enhancedImage: `data:image/jpeg;base64,${processedBuffer.toString('base64')}`,
    });
  } catch (error) {
    if (worker) {
      try {
        await worker.terminate();
      } catch {}
    }
    console.error('[Re-analysis Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Re-analysis processing failed on server',
    });
  }
};

export default {
  analyzeProductImage,
  reanalyzeProductImage,
};
