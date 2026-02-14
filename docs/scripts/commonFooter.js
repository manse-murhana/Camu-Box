(() => {
  const targets = document.querySelectorAll("[data-common-footer]");
  targets.forEach((target) => {
    const termsPath = target.getAttribute("data-terms-path") || "terms.html";
    target.classList.add("page-footer");

    // Clear existing content
    target.textContent = "";

    // GitHub link with icon
    const githubLink = document.createElement("a");
    githubLink.className = "github-link";
    githubLink.href = "https://github.com/Manse-Murhana/Camu-Box";
    githubLink.target = "_blank";
    githubLink.rel = "noopener";
    githubLink.setAttribute("aria-label", "GitHub repository");

    const githubSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    githubSvg.setAttribute("class", "github-icon");
    githubSvg.setAttribute("viewBox", "0 0 16 16");
    githubSvg.setAttribute("aria-hidden", "true");
    githubSvg.setAttribute("focusable", "false");

    const githubPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    githubPath.setAttribute(
      "d",
      "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
    );

    githubSvg.appendChild(githubPath);
    githubLink.appendChild(githubSvg);
    target.appendChild(githubLink);

    // Separator " / "
    target.appendChild(document.createTextNode(" / "));

    // Top link
    const topLink = document.createElement("a");
    topLink.className = "top-link";
    topLink.href = "https://manse-murhana.github.io/Camu-Box/";
    topLink.textContent = "Top";
    target.appendChild(topLink);

    // Separator " / "
    target.appendChild(document.createTextNode(" / "));

    // Terms link
    const termsLink = document.createElement("a");
    termsLink.className = "terms-link";
    termsLink.href = termsPath;
    termsLink.target = "_blank";
    termsLink.rel = "noopener";
    termsLink.textContent = "利用規約";
    target.appendChild(termsLink);
  });
})();
