function copy(elem) {
    elem.select();
    elem.setSelectionRange(0, 99999);
    document.execCommand("copy");
}