const CATALOG = [
    { id: "react-learn", topics: ["react", "frontend", "ui"], title: "Learn React", provider: "React Documentation", url: "https://react.dev/learn", estimatedMinutes: 60 },
    { id: "youtube-react-net-ninja", topics: ["react", "frontend", "ui"], title: "React Tutorials Playlist", provider: "Net Ninja · YouTube", url: "https://www.youtube.com/@NetNinja/playlists", estimatedMinutes: 90 },
    { id: "mdn-javascript", topics: ["javascript", "typescript", "frontend", "web"], title: "JavaScript Guide", provider: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", estimatedMinutes: 60 },
    { id: "youtube-javascript", topics: ["javascript", "typescript", "web"], title: "JavaScript Playlists", provider: "freeCodeCamp.org · YouTube", url: "https://www.youtube.com/@freecodecamp/playlists", estimatedMinutes: 90 },
    { id: "node-learn", topics: ["node", "express", "backend", "api"], title: "Node.js Learn", provider: "Node.js", url: "https://nodejs.org/en/learn", estimatedMinutes: 60 },
    { id: "youtube-node-piyush-garg", topics: ["node", "express", "backend", "api"], title: "Backend Development Playlist", provider: "Piyush Garg · YouTube", url: "https://www.youtube.com/@piyushgargdev/playlists", estimatedMinutes: 120 },
    { id: "mongodb-learn", topics: ["mongodb", "database", "nosql", "mongoose"], title: "MongoDB University", provider: "MongoDB", url: "https://learn.mongodb.com/", estimatedMinutes: 75 },
    { id: "youtube-mongodb", topics: ["mongodb", "database", "nosql", "mongoose"], title: "MongoDB Learning Playlist", provider: "MongoDB · YouTube", url: "https://www.youtube.com/@MongoDB/playlists", estimatedMinutes: 90 },
    { id: "sql-tutorial", topics: ["sql", "mysql", "postgresql", "database"], title: "SQL Tutorial", provider: "PostgreSQL Documentation", url: "https://www.postgresql.org/docs/current/tutorial.html", estimatedMinutes: 60 },
    { id: "youtube-sql", topics: ["sql", "mysql", "postgresql"], title: "SQL Course Playlist", provider: "freeCodeCamp.org · YouTube", url: "https://www.youtube.com/@freecodecamp/playlists", estimatedMinutes: 90 },
    { id: "web-performance", topics: ["performance", "web", "frontend"], title: "Web Performance", provider: "web.dev", url: "https://web.dev/learn/performance/", estimatedMinutes: 60 },
    { id: "youtube-web-performance", topics: ["performance", "web"], title: "Web Performance Playlist", provider: "Chrome for Developers · YouTube", url: "https://www.youtube.com/@ChromeDevs/playlists", estimatedMinutes: 60 },
    { id: "dsa-practice", topics: ["dsa", "data structures", "algorithms", "problem solving"], title: "Data Structures and Algorithms", provider: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/learn-data-structures-and-algorithms-dsa-tutorial/", estimatedMinutes: 75 },
    { id: "youtube-striver-dsa", topics: ["dsa", "data structures", "algorithms", "problem solving"], title: "Striver's A2Z DSA Course Playlist", provider: "take U forward · YouTube", url: "https://www.youtube.com/@takeUforward/playlists", estimatedMinutes: 120 },
    { id: "system-design", topics: ["system design", "architecture", "scalability"], title: "System Design Primer", provider: "GitHub", url: "https://github.com/donnemartin/system-design-primer", estimatedMinutes: 75 },
    { id: "youtube-system-design", topics: ["system design", "architecture", "scalability"], title: "System Design Playlist", provider: "Gaurav Sen · YouTube", url: "https://www.youtube.com/@gkcs/playlists", estimatedMinutes: 90 },
    { id: "salesforce-trailhead", topics: ["salesforce", "apex", "lwc", "crm"], title: "Trailhead", provider: "Salesforce", url: "https://trailhead.salesforce.com/", estimatedMinutes: 60 },
    { id: "youtube-salesforce", topics: ["salesforce", "apex", "lwc", "crm"], title: "Salesforce Developer Playlists", provider: "Salesforce Developers · YouTube", url: "https://www.youtube.com/@SalesforceDevelopers/playlists", estimatedMinutes: 90 },
    { id: "interview-practice", topics: ["interview", "behavioral", "technical"], title: "Interview preparation", provider: "CareerPilot AI", url: "/", estimatedMinutes: 45 },
    { id: "youtube-interview", topics: ["interview", "behavioral", "technical"], title: "Interview Preparation Playlists", provider: "take U forward · YouTube", url: "https://www.youtube.com/@takeUforward/playlists", estimatedMinutes: 90 },
    { id: "general-learning", topics: ["general"], title: "Developer Roadmaps", provider: "roadmap.sh", url: "https://roadmap.sh/", estimatedMinutes: 45 },
    { id: "youtube-general-learning", topics: ["general"], title: "Software Development Playlists", provider: "freeCodeCamp.org · YouTube", url: "https://www.youtube.com/@freecodecamp/playlists", estimatedMinutes: 90 },
];

function normalize(value) {
    return String(value || "").toLowerCase();
}

function getResourcesForTopic(topic, limit = 2) {
    const normalizedTopic = normalize(topic);
    const matching = CATALOG.filter((resource) => resource.topics.some((item) => normalizedTopic.includes(item) || item.includes(normalizedTopic)));
    const selected = matching.length
        ? matching
        : CATALOG.filter((resource) => resource.topics.includes("general"));

    const primary = selected.find((resource) => !resource.provider.includes("YouTube"));
    const video = selected.find((resource) => resource.provider.includes("YouTube"));
    const remaining = selected.filter((resource) => resource !== primary && resource !== video);
    const ordered = [primary, video, ...remaining].filter(Boolean);

    return ordered.slice(0, Math.max(limit, 2)).map(({ id, title, provider, url, estimatedMinutes }) => ({
        resourceId: id,
        title,
        provider,
        url,
        estimatedMinutes,
    }));
}

function getYouTubeResourcesForTopic(topic) {
    return getResourcesForTopic(topic).filter((resource) => resource.provider.includes("YouTube"));
}

module.exports = { getResourcesForTopic, getYouTubeResourcesForTopic };
