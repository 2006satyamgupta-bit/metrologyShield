const Tesseract = require("tesseract.js");
const fs = require("fs");

async function run() {
  const imageSource = process.argv[2];
  const analysisId = process.argv[3] || "analysis";
  const startTime = Date.now();

  if (!imageSource || !fs.existsSync(imageSource)) {
    process.stdout.write(JSON.stringify({ success: false, error: "Image file not found" }));
    process.exit(0);
  }

  try {
    const res = await Tesseract.recognize(imageSource, "eng");
    const data = res.data || {};
    const rawText = (data.text || "").trim();
    const confidence = Math.round(data.confidence || 0);

    const words = (data.words || []).map((w) => ({
      text: w.text,
      confidence: w.confidence,
      bbox: w.bbox
        ? {
            x0: w.bbox.x0,
            y0: w.bbox.y0,
            x1: w.bbox.x1,
            y1: w.bbox.y1,
          }
        : undefined,
    }));

    const lines = (data.lines || []).map((l, idx) => ({
      lineIndex: idx,
      text: l.text ? l.text.trim() : "",
      confidence: l.confidence,
      bbox: l.bbox
        ? {
            x0: l.bbox.x0,
            y0: l.bbox.y0,
            x1: l.bbox.x1,
            y1: l.bbox.y1,
          }
        : undefined,
      words: (l.words || []).map((w) => ({
        text: w.text,
        confidence: w.confidence,
        bbox: w.bbox
          ? {
              x0: w.bbox.x0,
              y0: w.bbox.y0,
              x1: w.bbox.x1,
              y1: w.bbox.y1,
            }
          : undefined,
      })),
    }));

    process.stdout.write(
      JSON.stringify({
        success: true,
        data: {
          rawText,
          confidence: confidence > 0 ? confidence : 80,
          wordCount: rawText.split(/\s+/).filter(Boolean).length,
          processingTimeMs: Date.now() - startTime,
          words,
          lines,
        },
      })
    );
  } catch (err) {
    process.stdout.write(
      JSON.stringify({
        success: false,
        error: err.message || String(err),
      })
    );
  }
}

run();
