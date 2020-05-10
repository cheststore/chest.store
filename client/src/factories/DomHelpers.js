export default {
  downloadUri(uri, name) {
    const link = document.createElement("a")
    link.id = name
    link.download = name
    link.href = uri
    link.click()
  }
}
