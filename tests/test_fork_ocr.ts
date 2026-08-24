import { fork } from "child_process";
import path from "path";

async function testForkOcr() {
  const runnerPath = path.join(process.cwd(), "services", "ocr", "ocrRunner.js");
  const testImage = path.join(process.cwd(), "public", "uploads", "04a49c31-d3c5-4c3e-a735-18b4739621c8-8d9568ed-f2cc-4e22-a16a-2c8fdff2b4fa.jpeg");

  console.log("Forking OCR worker for image:", testImage);
  const start = Date.now();

  const child = fork(runnerPath);

  child.on("message", (msg: any) => {
    console.log(`Worker responded in ${Date.now() - start}ms:`);
    console.log("Success:", msg.success);
    if (msg.success) {
      console.log("Extracted text preview:", msg.data.rawText.slice(0, 120));
      console.log("Confidence:", msg.data.confidence);
    } else {
      console.error("Error:", msg.error);
    }
    child.kill();
  });

  child.send({ imageSource: testImage, analysisId: "test-fork-1" });
}

testForkOcr();
