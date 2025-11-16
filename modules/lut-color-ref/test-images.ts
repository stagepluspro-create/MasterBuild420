export interface TestImage {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
  width: number;
  height: number;
}

export const testImages: TestImage[] = [
  {
    id: 'gradient',
    name: 'Color Gradient',
    description: 'Smooth gradient from black to white with color bands',
    width: 400,
    height: 300,
    dataUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <defs>
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
          </linearGradient>
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(0,255,0);stop-opacity:1" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
          </linearGradient>
          <linearGradient id="grayGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(255,255,255);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect fill="url(#redGrad)" x="0" y="0" width="400" height="75"/>
        <rect fill="url(#greenGrad)" x="0" y="75" width="400" height="75"/>
        <rect fill="url(#blueGrad)" x="0" y="150" width="400" height="75"/>
        <rect fill="url(#grayGrad)" x="0" y="225" width="400" height="75"/>
      </svg>
    `)
  },
  {
    id: 'color-checker',
    name: 'Color Checker',
    description: '24-patch color reference chart',
    width: 400,
    height: 300,
    dataUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#734838" x="0" y="0" width="66.67" height="100"/>
        <rect fill="#c29682" x="66.67" y="0" width="66.67" height="100"/>
        <rect fill="#627a9d" x="133.33" y="0" width="66.67" height="100"/>
        <rect fill="#576c43" x="200" y="0" width="66.67" height="100"/>
        <rect fill="#8580b1" x="266.67" y="0" width="66.67" height="100"/>
        <rect fill="#67bdaa" x="333.33" y="0" width="66.67" height="100"/>

        <rect fill="#d67e2c" x="0" y="100" width="66.67" height="100"/>
        <rect fill="#505ba6" x="66.67" y="100" width="66.67" height="100"/>
        <rect fill="#c15a63" x="133.33" y="100" width="66.67" height="100"/>
        <rect fill="#5e3c6c" x="200" y="100" width="66.67" height="100"/>
        <rect fill="#9dbc40" x="266.67" y="100" width="66.67" height="100"/>
        <rect fill="#e0a32e" x="333.33" y="100" width="66.67" height="100"/>

        <rect fill="#383d96" x="0" y="200" width="66.67" height="100"/>
        <rect fill="#469449" x="66.67" y="200" width="66.67" height="100"/>
        <rect fill="#af363c" x="133.33" y="200" width="66.67" height="100"/>
        <rect fill="#e7c71f" x="200" y="200" width="66.67" height="100"/>
        <rect fill="#bb5695" x="266.67" y="200" width="66.67" height="100"/>
        <rect fill="#0885a1" x="333.33" y="200" width="66.67" height="100"/>

        <rect fill="#f3f3f2" x="0" y="200" width="50" height="100"/>
        <rect fill="#c8c8c8" x="50" y="200" width="50" height="100"/>
        <rect fill="#a0a0a0" x="100" y="200" width="50" height="100"/>
        <rect fill="#7a7a79" x="150" y="200" width="50" height="100"/>
        <rect fill="#555555" x="200" y="200" width="50" height="100"/>
        <rect fill="#343434" x="250" y="200" width="50" height="100"/>
      </svg>
    `)
  },
  {
    id: 'skin-tones',
    name: 'Skin Tone Reference',
    description: 'Various skin tone samples for color grading',
    width: 400,
    height: 300,
    dataUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#8d5524" x="0" y="0" width="80" height="150"/>
        <rect fill="#c68642" x="80" y="0" width="80" height="150"/>
        <rect fill="#e0ac69" x="160" y="0" width="80" height="150"/>
        <rect fill="#f1c27d" x="240" y="0" width="80" height="150"/>
        <rect fill="#ffdbac" x="320" y="0" width="80" height="150"/>

        <rect fill="#4a2511" x="0" y="150" width="80" height="150"/>
        <rect fill="#8d5524" x="80" y="150" width="80" height="150"/>
        <rect fill="#c68642" x="160" y="150" width="80" height="150"/>
        <rect fill="#e0ac69" x="240" y="150" width="80" height="150"/>
        <rect fill="#f1c27d" x="320" y="150" width="80" height="150"/>
      </svg>
    `)
  },
  {
    id: 'led-wall',
    name: 'LED Wall Scene',
    description: 'Simulated LED wall with color blocks',
    width: 400,
    height: 300,
    dataUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#000000" x="0" y="0" width="400" height="300"/>

        <rect fill="#ff0000" x="20" y="20" width="80" height="80"/>
        <rect fill="#00ff00" x="110" y="20" width="80" height="80"/>
        <rect fill="#0000ff" x="200" y="20" width="80" height="80"/>
        <rect fill="#ffff00" x="290" y="20" width="80" height="80"/>

        <rect fill="#ff00ff" x="20" y="110" width="80" height="80"/>
        <rect fill="#00ffff" x="110" y="110" width="80" height="80"/>
        <rect fill="#ff8800" x="200" y="110" width="80" height="80"/>
        <rect fill="#8800ff" x="290" y="110" width="80" height="80"/>

        <rect fill="#ffffff" x="65" y="200" width="270" height="80"/>
      </svg>
    `)
  },
  {
    id: 'white-balance',
    name: 'White Balance Test',
    description: 'Neutral gray scale for white balance calibration',
    width: 400,
    height: 300,
    dataUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#000000" x="0" y="0" width="50" height="300"/>
        <rect fill="#1a1a1a" x="50" y="0" width="50" height="300"/>
        <rect fill="#333333" x="100" y="0" width="50" height="300"/>
        <rect fill="#4d4d4d" x="150" y="0" width="50" height="300"/>
        <rect fill="#666666" x="200" y="0" width="50" height="300"/>
        <rect fill="#808080" x="250" y="0" width="50" height="300"/>
        <rect fill="#999999" x="300" y="0" width="50" height="300"/>
        <rect fill="#b3b3b3" x="350" y="0" width="50" height="300"/>

        <circle fill="#ffffff" cx="200" cy="150" r="60"/>
        <circle fill="#808080" cx="200" cy="150" r="40"/>
        <circle fill="#000000" cx="200" cy="150" r="20"/>
      </svg>
    `)
  }
];

export function getTestImageById(id: string): TestImage | undefined {
  return testImages.find(img => img.id === id);
}

export async function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function loadImageToCanvas(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement
): Promise<ImageData> {
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
