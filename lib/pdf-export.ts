export async function captureElementToPDF(element: HTMLElement, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default
  const { jsPDF } = await import("jspdf")

  // Заранее прогреваем Montserrat у браузера — чтобы шрифт был кеширован
  // к моменту, когда html2canvas склонирует поддерево в офскрин-фрейм.
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load("400 16px Montserrat"),
        document.fonts.load("500 16px Montserrat"),
        document.fonts.load("600 16px Montserrat"),
        document.fonts.load("700 16px Montserrat"),
      ])
    } catch { /* не блокируем экспорт, если шрифт не подхватился */ }
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    // html2canvas не парсит oklch() из Tailwind v4 → стили срезаем.
    // Шрифт инжекчем повторно через Google Fonts (он уже в кеше браузера
    // после прогрева выше) и подкрепляем дублирующим именем 'Montserrat'.
    onclone: (doc, clonedElement) => {
      doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove())
      const fontLink = doc.createElement("link")
      fontLink.rel = "stylesheet"
      fontLink.href =
        "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
      doc.head.appendChild(fontLink)
      clonedElement.style.background = "#ffffff"
      clonedElement.style.color = "#0f172a"
      clonedElement.style.fontFamily =
        "'Montserrat', 'Trebuchet MS', 'Lucida Sans Unicode', sans-serif"
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
