export function compressImage(dataUrl: string, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const side = Math.min(image.width, image.height)
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      canvas.getContext("2d")!.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, size, size)
      resolve(canvas.toDataURL("image/jpeg", 0.85))
    }
    image.onerror = () => reject(new Error("That file isn't an image"))
    image.src = dataUrl
  })
}
