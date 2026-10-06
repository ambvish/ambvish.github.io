// "Email" links show the address right away and copy it, instead of relying on a mail app being
// set up. The note under the links offers the mail app as a second option. Without JavaScript
// the link is a normal mailto: link.
export function initEmail() {
  const toast = document.querySelector("[data-email-toast]");
  let hideTimer;

  for (const link of document.querySelectorAll("[data-copy-email]")) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const address = link.dataset.copyEmail;
      if (!toast) return;

      const text = document.createElement("span");
      text.textContent = address;
      const mail = document.createElement("a");
      mail.href = `mailto:${address}`;
      mail.textContent = "Open in mail app";
      toast.replaceChildren(text, " · ", mail);
      toast.hidden = false;
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        toast.hidden = true;
      }, 10000);

      // Copy too, where the browser allows it.
      navigator.clipboard
        ?.writeText(address)
        .then(() => {
          text.textContent = `Copied ${address}`;
        })
        .catch(() => {});
    });
  }
}
