import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
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

    // 2. Pre-process image with sharp to dramatically improve OCR legibility:
    //    - Auto-rotate according to EXIF orientation
    //    - Resize canvas to high definition (max 2200px) so fine print text is sharply separated
    //    - Convert to Grayscale to remove background color noise
    //    - Normalize contrast across the full dynamic range
    //    - Sharpen edges of text characters
    let processedBuffer = imageSource;
    try {
      processedBuffer = await sharp(imageSource)
        .rotate()
        .resize({ width: 2200, withoutEnlargement: false, fit: 'inside' })
        .grayscale()
        .normalize()
        .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7 })
        .toBuffer();
    } catch (sharpError) {
      console.warn('[Sharp Preprocessing Warning]: Falling back to original image buffer:', sharpError.message);
      processedBuffer = imageSource;
    }

    // 3. Initialize Tesseract OCR worker
    worker = await createWorker('eng');

    // 4. Perform OCR recognition on enhanced image buffer
    const ret = await worker.recognize(processedBuffer);
    const extractedText = (ret.data && ret.data.text) ? String(ret.data.text) : '';
    const confidence = (ret.data && typeof ret.data.confidence === 'number') ? ret.data.confidence : 0;

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

    // 6. Evaluate real extracted text against 2011 Legal Metrology Rules with forgiving fuzzy regex
    const evaluation = analyzePackagingText(trimmedText);

    return res.status(200).json({
      success: true,
      message: 'OCR analysis completed successfully',
      extractedText: trimmedText,
      ocrConfidence: `${Math.round(confidence)}%`,
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

export default {
  analyzeProductImage,
};
