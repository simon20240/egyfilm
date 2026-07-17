const SEO = {
    init: function() {
        // No initialization needed for now
    },

    updateMetadata: function(page, data) {
        const head = document.querySelector('head');
        if (!head) return;

        this.clearSeoTags(head);

        let metadata = this.generateMetadata(page, data);
        this.generateSeoTags(metadata);
    },

    generateMetadata: function(page, data) {
        let title, description, keywords, canonical, og, twitter;

        const siteTitle = "EgyFilm";
        const siteDescription = "موقع EgyFilm لمشاهدة وتحميل أحدث الأفلام والمسلسلات العربية والأجنبية والهندية والتركية والأسيوية بجودة عالية.";
        const defaultImage = `${window.location.origin}/public/logo.png`;
        const twitterSite = "@EgyFilm";

        canonical = window.location.href;

        switch(page) {
            case 'home':
                title = `${siteTitle} - مشاهدة الأفلام والمسلسلات`;
                description = siteDescription;
                keywords = "EgyFilm, أفلام, مسلسلات, مشاهدة, تحميل, مترجم, عربي, egybest";
                break;
            case 'details':
                const item = data.item;
                const mediaType = data.mediaType === 'tv' ? 'مسلسل' : 'فيلم';
                const arabicTitle = item.title || item.name;
                const englishTitle = item.original_title || item.original_name;
                const year = (item.release_date || item.first_air_date || '').substring(0, 4);

                title = `مشاهدة ${mediaType} ${arabicTitle} (${year}) مترجم - ${siteTitle}`;
                description = item.overview ? item.overview.substring(0, 160) : `شاهد ${mediaType} ${arabicTitle} مترجم بجودة عالية على ${siteTitle}.`;
                keywords = `${arabicTitle}, ${englishTitle}, ${year}, ${mediaType}, مشاهدة, مترجم, ${siteTitle}`;
                canonical = `${window.location.origin}/#details/${data.mediaType}/${item.id}`;
                og = {
                    type: data.mediaType === 'tv' ? 'video.tv_show' : 'video.movie',
                    image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : defaultImage,
                };
                break;
            default:
                title = `${siteTitle} - مشاهدة الأفلام والمسلسلات`;
                description = siteDescription;
                keywords = "EgyFilm, أفلام, مسلسلات, مشاهدة, تحميل, مترجم, عربي, egybest";
                break;
        }

        og = {
            title: title,
            description: description,
            image: (og && og.image) || defaultImage,
            type: (og && og.type) || 'website',
            site_name: siteTitle,
            url: canonical
        };

        twitter = {
            title: title,
            description: description,
            image: (og && og.image) || defaultImage
        };

        return { title, description, keywords, canonical, og, twitter };
    },

    generateSeoTags: function(metadata) {
        document.title = metadata.title;
        this.createMetaTag('name', 'description', metadata.description);
        this.createMetaTag('name', 'keywords', metadata.keywords);
        this.createLinkTag('canonical', metadata.canonical);
        this.createMetaTag('property', 'og:title', metadata.og.title);
        this.createMetaTag('property', 'og:description', metadata.og.description);
        this.createMetaTag('property', 'og:image', metadata.og.image);
        this.createMetaTag('property', 'og:url', metadata.og.url);
        this.createMetaTag('property', 'og:type', metadata.og.type);
        this.createMetaTag('property', 'og:site_name', metadata.og.site_name);
        this.createMetaTag('name', 'twitter:card', 'summary_large_image');
        this.createMetaTag('name', 'twitter:site', '@EgyFilm');
        this.createMetaTag('name', 'twitter:title', metadata.twitter.title);
        this.createMetaTag('name', 'twitter:description', metadata.twitter.description);
        this.createMetaTag('name', 'twitter:image', metadata.twitter.image);
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
                    "url": "window.location.origin",
                    "name": "EgyFilm",
                    "description": "موقع EgyFilm لمشاهدة وتحميل أحدث الأفلام والمسلسلات العربية والأجنبية والهندية والتركية والأسيوية بجودة عالية.",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "window.location.origin#search/{search_term_string}",
                        "query-input": "required name=search_term_string"
                    }
                };
                break;
            case 'details':
                const item = data.item;
                const mediaType = data.mediaType;
                const url = `window.location.origin#details/${mediaType}/${item.id}`;

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

    createLinkTag: function(rel, href) {
        const head = document.querySelector('head');
        if (!head) return;

        const link = document.createElement('link');
        link.setAttribute('rel', rel);
        link.setAttribute('href', href);
        head.appendChild(link);
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