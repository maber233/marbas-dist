(function () {
    const config = window.DOWNLOAD_PAGE_CONFIG;

    if (!config || !config.releasesUrl) {
        return;
    }

    let releases = [];

    async function fetchReleases() {
        try {
            const response = await fetch(config.releasesUrl);
            if (!response.ok) {
                throw new Error("Failed to fetch releases");
            }

            const data = await response.json();
            releases = Array.isArray(data) ? data : [];
        } catch (error) {
            releases = [];
        }

        render();
    }

    function render() {
        const container = document.getElementById("download-content");

        if (!releases.length) {
            renderEmpty();
            return;
        }

        const options = releases.map((release, index) =>
            `<option value="${index}">${release.tag_name}${index === 0 ? " (latest)" : ""}</option>`
        ).join("");

        container.innerHTML = `
            <div class="version-row">
                <label for="version-select">Version</label>
                <select id="version-select">
                    ${options}
                </select>
            </div>
            <a class="download-btn" id="download-btn" href="#">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 12l-4-4h2.5V3h3v5H12L8 12z"></path><path d="M3 14h10v-1H3v1z"></path></svg>
                Download for macOS
            </a>
            <div class="download-meta">
                <span id="download-count"></span>
                <span id="release-date"></span>
            </div>
        `;

        document.getElementById("version-select").addEventListener("change", onVersionChange);
        void onVersionChange();
    }

    function renderEmpty() {
        const container = document.getElementById("download-content");
        container.innerHTML = `
            <div class="empty-state">
                <p>No releases available yet.</p>
                <p style="margin-top: 8px;">Check back soon for the first release.</p>
            </div>
        `;
    }

    async function onVersionChange() {
        const select = document.getElementById("version-select");
        const release = releases[Number(select.value)];
        const button = document.getElementById("download-btn");
        const countEl = document.getElementById("download-count");
        const dateEl = document.getElementById("release-date");
        const notesSection = document.getElementById("release-notes");
        const notesBody = document.getElementById("release-notes-body");

        const asset = Array.isArray(release.assets)
            ? release.assets.find((item) => item.name.endsWith(".zip") || item.name.endsWith(".dmg"))
            : null;

        if (asset) {
            button.href = asset.browser_download_url;
            const totalDownloads = release.assets.reduce((sum, item) => sum + (item.download_count || 0), 0);
            countEl.textContent = `${totalDownloads.toLocaleString()} download${totalDownloads !== 1 ? "s" : ""}`;
        } else {
            button.href = release.zipball_url || "#";
            countEl.textContent = "";
        }

        const date = new Date(release.published_at);
        dateEl.textContent = Number.isNaN(date.getTime())
            ? ""
            : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

        if (release.body && release.body.trim()) {
            notesSection.style.display = "block";
            notesBody.textContent = release.body;
            return;
        }

        if (release.body_url) {
            try {
                const response = await fetch(release.body_url);
                if (!response.ok) {
                    throw new Error("Failed to load release notes");
                }

                const body = await response.text();
                if (body.trim()) {
                    notesSection.style.display = "block";
                    notesBody.textContent = body;
                } else {
                    notesSection.style.display = "none";
                    notesBody.textContent = "";
                }
            } catch (error) {
                notesSection.style.display = "none";
                notesBody.textContent = "";
            }
            return;
        }

        notesSection.style.display = "none";
        notesBody.textContent = "";
    }

    void fetchReleases();
}());