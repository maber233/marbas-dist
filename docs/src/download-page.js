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

            let data = await response.json();
            data = Array.isArray(data) ? data : [];

            // Filter by tag prefix if configured (e.g. "recall-" keeps only recall-v1.0, recall-v1.1, etc.)
            if (config.tagPrefix) {
                data = data.filter((r) => r.tag_name && r.tag_name.startsWith(config.tagPrefix));
                data = data.map((r) => ({
                    ...r,
                    tag_name: r.tag_name.slice(config.tagPrefix.length)
                }));
            }

            releases = data;
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

        const release = releases[0];

        container.innerHTML = `
            <div class="version-row">
                <span class="version-label">${release.tag_name}</span>
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

        void showRelease(release);
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

    function renderMarkdown(md) {
        let html = md
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Headers
        html = html.replace(/^### (.+)$/gm, "<h5>$1</h5>");
        html = html.replace(/^## (.+)$/gm, "<h4>$1</h4>");
        html = html.replace(/^# (.+)$/gm, "<h3>$1</h3>");

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

        // Convert list items
        html = html.replace(/^- (.+)$/gm, "<li>$1</li>");

        // Wrap consecutive <li> in <ul>
        html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

        // Paragraphs: wrap non-empty lines that aren't already wrapped in tags
        html = html.replace(/^(?!<[hulo]|<li|$)(.+)$/gm, "<p>$1</p>");

        // Remove empty lines
        html = html.replace(/\n{2,}/g, "\n");

        return html.trim();
    }

    async function showRelease(release) {
        const button = document.getElementById("download-btn");
        const countEl = document.getElementById("download-count");
        const dateEl = document.getElementById("release-date");
        const notesSection = document.getElementById("release-notes");
        const notesBody = document.getElementById("release-notes-body");

        const asset = Array.isArray(release.assets)
            ? release.assets.find((item) => item.name.endsWith(".zip") || item.name.endsWith(".dmg"))
            : null;

        const showStats = new URLSearchParams(window.location.search).has("showStats");

        if (asset) {
            button.href = asset.browser_download_url;
            if (showStats) {
                const totalDownloads = release.assets.reduce((sum, item) => sum + (item.download_count || 0), 0);
                countEl.textContent = `${totalDownloads.toLocaleString()} download${totalDownloads !== 1 ? "s" : ""}`;
            } else {
                countEl.textContent = "";
            }
        } else {
            button.href = release.zipball_url || "#";
            countEl.textContent = "";
        }

        dateEl.textContent = "";

        if (release.body && release.body.trim()) {
            notesSection.style.display = "block";
            notesBody.innerHTML = renderMarkdown(release.body);
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
                    notesBody.innerHTML = renderMarkdown(body);
                } else {
                    notesSection.style.display = "none";
                    notesBody.innerHTML = "";
                }
            } catch (error) {
                notesSection.style.display = "none";
                notesBody.textContent = "";
            }
            return;
        }

        notesSection.style.display = "none";
        notesBody.innerHTML = "";
    }

    void fetchReleases();
}());