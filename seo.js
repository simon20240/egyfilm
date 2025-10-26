const SEO = {
    init: function() {
        // No initialization needed for now
    },

    updateMetadata: function(page, data) {
        const head = document.querySelector('head');
        if (!head) return;

        // Clear existing SEO tags
        this.clearSeoTags(head);

        let title, description, keywords, ogTitle, ogDescription, ogImage, ogType, ogSiteName;

        ogSiteName = "EgyFilm";
        ogType = "website";
        ogImage = "https://egyfilm-three.vercel.app/public/logo.png"; // A default logo

        switch(page) {
            case 'home':
                title = "EgyFilm - مشاهدة الأفلام والمسلسلات";
                description = "موقع EgyFilm لمشاهدة وتحميل أحدث الأفلام والمسلسلات العربية والأجنبية والهندية والتركية والأسيوية بجودة عالية.";
                keywords = "EgyFilm, أفلام, مسلسلات, مشاهدة, تحميل, مترجم, عربي, egybest";
                ogTitle = title;
                ogDescription = description;
                break;
            case 'details':
                const item = data.item;
                const mediaType = data.mediaType === 'tv' ? 'مسلسل' : 'فيلم';
                const arabicTitle = item.title || item.name;
                const englishTitle = item.original_title || item.original_name;
                const year = (item.release_date || item.first_air_date || '').substring(0, 4);

                title = `مشاهدة ${mediaType} ${arabicTitle} (${year}) مترجم - EgyFilm`;
                description = item.overview ? item.overview.substring(0, 160) : `شاهد ${mediaType} ${arabicTitle} مترجم بجودة عالية على EgyFilm.`;
                keywords = `${arabicTitle}, ${englishTitle}, ${year}, ${mediaType}, مشاهدة, مترجم, EgyFilm`;
                ogTitle = title;
                ogDescription = description;
                ogImage = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : ogImage;
                ogType = data.mediaType === 'tv' ? 'video.tv_show' : 'video.movie';
                break;
            default:
                title = "EgyFilm - مشاهدة الأفلام والمسلسلات";
                description = "موقع EgyFilm لمشاهدة وتحميل أحدث الأفلام والمسلسلات العربية والأجنبية والهندية والتركية والأسيوية بجودة عالية.";
                keywords = "EgyFilm, أفلام, مسلسلات, مشاهدة, تحميل, مترجم, عربي, egybest";
                ogTitle = title;
                ogDescription = description;
                break;
        }

        document.title = title;
        this.createMetaTag('name', 'description', description);
        this.createMetaTag('name', 'keywords', keywords);
        this.createMetaTag('property', 'og:title', ogTitle);
        this.createMetaTag('property', 'og:description', ogDescription);
        this.createMetaTag('property', 'og:image', ogImage);
        this.createMetaTag('property', 'og:type', ogType);
        this.createMetaTag('property', 'og:site_name', ogSiteName);
        this.createMetaTag('name', 'robots', 'index, follow');
    },

    injectStructuredData: function(page, data) {
        const head = document.querySelector('head');
        if (!head) return;

        // Clear existing structured data
        const existingSchema = document.querySelector('script[type="application/ld+json"]');
        if (existingSchema) {
            existingSchema.remove();
        }

        let schema;

        switch(page) {
            case 'home':
                schema = {
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "url": "https://egyfilm-three.vercel.app/",
                    "name": "EgyFilm",
                    "description": "موقع EgyFilm لمشاهدة وتحميل أحدث الأفلام والمسلسلات العربية والأجنبية والهندية والتركية والأسيوية بجودة عالية.",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "https://egyfilm-three.vercel.app/#search/{search_term_string}",
                        "query-input": "required name=search_term_string"
                    }
                };
                break;
            case 'details':
                const item = data.item;
                const mediaType = data.mediaType;
                const url = `https://egyfilm-three.vercel.app/#details/${mediaType}/${item.id}`;

                if (mediaType === 'movie') {
                    schema = {
                        "@context": "https://schema.org",
                        "@type": "Movie",
                        "name": item.title,
                        "url": url,
                        "image": `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                        "description": item.overview,
                        "datePublished": item.release_date,
                        "genre": item.genres.map(g => g.name),
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": item.vote_average,
                            "ratingCount": item.vote_count
                        }
                    };
                } else if (mediaType === 'tv') {
                    schema = {
                        "@context": "https://schema.org",
                        "@type": "TVSeries",
                        "name": item.name,
                        "url": url,
                        "image": `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                        "description": item.overview,
                        "numberOfSeasons": item.number_of_seasons,
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": item.vote_average,
                            "ratingCount": item.vote_count
                        }
                    };
                }
                break;
        }

        if (schema) {
            const schemaScript = document.createElement('script');
            schemaScript.type = 'application/ld+json';
            schemaScript.textContent = JSON.stringify(schema);
            head.appendChild(schemaScript);
        }
    },

    createMetaTag: function(attr, name, content) {
        const head = document.querySelector('head');
        if (!head) return;

        const meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute('content', content);
        head.appendChild(meta);
    },

    clearSeoTags: function(head) {
        const selectors = [
            'meta[name="description"]',
            'meta[name="keywords"]',
            'meta[property^="og:"]',
            'meta[name="robots"]'
        ];
        selectors.forEach(selector => {
            const tags = head.querySelectorAll(selector);
            tags.forEach(tag => tag.remove());
        });
    }
};

SEO.init();