export async function captureElementToPDF(element: HTMLElement, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    // Удаляем все внешние стили из клонированного документа:
    // StatsPDFReport использует 100% inline-стили, поэтому Tailwind/shadcn
    // oklch()-переменные не нужны и только ломают html2canvas
    onclone: (_doc, clonedElement) => {
      const root = clonedElement.ownerDocument
      root.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove())
      // Гарантируем белый фон без CSS-переменных
      clonedElement.style.background = "#ffffff"
      clonedElement.style.color = "#1e293b"
    },
  })

  if (canvas.width === 0 || canvas.height === 0) {
    throw new Error("html2canvas вернул пустой canvas — элемент не найден в DOM")
  }

  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" })

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgH = (canvas.height * pageW) / canvas.width

  let yLeft = imgH
  let yPos = 0

  pdf.addImage(imgData, "PNG", 0, yPos, pageW, imgH)
  yLeft -= pageH

  while (yLeft > 0) {
    yPos -= pageH
    pdf.addPage()
    pdf.addImage(imgData, "PNG", 0, yPos, pageW, imgH)
    yLeft -= pageH
  }

  pdf.save(filename)
}
