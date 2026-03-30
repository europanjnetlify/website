const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const postsDir = './content/blog';
const posts = [];

// Guard: skip if no content folder yet
if (!fs.existsSync(postsDir)) {
  console.log('No content/blog directory found, skipping.');
  process.exit(0);
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

if (files.length === 0) {
  console.log('No posts found yet, skipping.');
  process.exit(0);
}

files.forEach(file => {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const { data, content } = matter(raw);
  posts.push({
    ...data,
    content: marked(content),
    slug: file.replace('.md', '')
  });
});

// Sort: featured first, then newest
posts.sort((a, b) => {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return new Date(b.date) - new Date(a.date);
});

// ─── Generate individual post pages ──────────────────────────────────────────
function generatePostHTML(post) {
  const seoTitle     = post.seo_title || post.title;
  const seoDesc      = post.seo_description || post.excerpt || '';
  const ogImage      = post.cover_image || '/images/banner_bg.webp';
  const canonical    = `https://europalp.com/blog/${post.slug}`;
  const robots       = post.no_index ? 'noindex, nofollow' : 'index, follow';
  const author       = post.author_name || 'Europa Luxury Properties';
  const lastModified = post.last_modified || post.date;
  const tags         = Array.isArray(post.tags) ? post.tags : (post.tags ? [post.tags] : []);
  const tagsString   = tags.join(', ');
  const publishedDate = new Date(post.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  const metaBar = `
    <div class="cs-post-meta">
      <div class="cs-meta-item">
        <img class="cs-icon" src="https://csimg.nyc3.cdn.digitaloceanspaces.com/Icons/calendar.svg" alt="date" width="16" height="16" />
        <time datetime="${new Date(post.date).toISOString()}">${publishedDate}</time>
      </div>
      ${post.author_name ? `<div class="cs-meta-item"><span>By ${author}</span></div>` : ''}
      ${post.reading_time ? `<div class="cs-meta-item"><span>${post.reading_time} min read</span></div>` : ''}
      ${post.category ? `<div class="cs-meta-item"><span>${post.category}</span></div>` : ''}
    </div>
    ${tags.length > 0 ? `<div class="cs-tags">${tags.map(t => `<span class="cs-tag">${t}</span>`).join('')}</div>` : ''}`;

  const jsonLd = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${seoTitle}",
    "description": "${seoDesc}",
    "url": "${canonical}",
    "datePublished": "${new Date(post.date).toISOString()}",
    "dateModified": "${new Date(lastModified).toISOString()}",
    ${tagsString ? `"keywords": "${tagsString}",` : ''}
    ${post.category ? `"articleSection": "${post.category}",` : ''}
    "author": { "@type": "Organization", "name": "${author}" },
    "publisher": {
      "@type": "Organization",
      "name": "Europa Luxury Properties",
      "logo": { "@type": "ImageObject", "url": "https://europalp.com/images/europalp_logo-200x60.webp" }
    },
    "image": { "@type": "ImageObject", "url": "https://europalp.com${ogImage}" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${canonical}" }
  }
  <\/script>`;

  const breadcrumbHTML = `
  <nav class="cs-breadcrumb" aria-label="Breadcrumb">
    <ol style="display:flex;gap:0.5rem;list-style:none;padding:1rem 2rem;font-size:0.875rem;margin:0;">
      <li><a href="/index.html" style="color:var(--primary);text-decoration:none;">Home</a> /</li>
      <li><a href="/blog.html" style="color:var(--primary);text-decoration:none;">Blog</a> /</li>
      <li aria-current="page" style="color:#374151;">${post.title}</li>
    </ol>
  </nav>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="${robots}" />
  <meta name="description" content="${seoDesc}" />
  <meta name="author" content="${author}" />
  ${tagsString ? `<meta name="keywords" content="${tagsString}" />` : ''}
  <title>${seoTitle} | Europa Luxury Properties</title>
  <link rel="canonical" href="${canonical}" />
  <link rel="icon" href="/favicon.ico" type="image/x-icon">
  <link rel="apple-touch-icon" sizes="180x180" href="../images/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="../images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="../images/favicon-16x16.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${seoTitle}" />
  <meta property="og:description" content="${seoDesc}" />
  <meta property="og:image" content="https://europalp.com${ogImage}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${seoTitle}" />
  <meta name="twitter:description" content="${seoDesc}" />
  <meta name="twitter:image" content="https://europalp.com${ogImage}" />
  <link rel="stylesheet" href="../css/core.css">
  <link rel="stylesheet" href="../css/blog.css">
  ${jsonLd}
  <script>
    let analytics_loaded = false;
    const analytics_script_id = 'G-M7620RPN05';
    function swd_load_analytics() {
      if (!analytics_loaded) {
        const s = document.createElement('script');
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + analytics_script_id;
        s.onload = function () {
          window.dataLayer = window.dataLayer || [];
          function gtag() { dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', analytics_script_id);
        };
        document.head.appendChild(s);
        analytics_loaded = true;
      }
    }
    document.addEventListener('DOMContentLoaded', function () {
      window.addEventListener('scroll', swd_load_analytics);
      window.addEventListener('mousemove', swd_load_analytics);
    });
  <\/script>
</head>
<body>

  <header id="cs-navigation">
    <div class="cs-container">
      <a href="/index.html" class="cs-logo" aria-label="back to home">
        <img src="../images/europalp_logo-200x60.webp" alt="Europa Luxury Properties logo" decoding="async" width="200" height="60">
      </a>
      <nav class="cs-nav" role="navigation">
        <button class="cs-toggle" aria-label="mobile menu toggle">
          <div class="cs-box" aria-hidden="true">
            <span class="cs-line cs-line1" aria-hidden="true"></span>
            <span class="cs-line cs-line2" aria-hidden="true"></span>
            <span class="cs-line cs-line3" aria-hidden="true"></span>
          </div>
        </button>
        <div class="cs-ul-wrapper">
          <ul id="cs-expanded" class="cs-ul" aria-expanded="false">
            <li class="cs-li"><a href="/index.html" class="cs-li-link">Home</a></li>
            <li class="cs-li"><a href="/about.html" class="cs-li-link">About</a></li>
            <li class="cs-li"><a href="/services.html" class="cs-li-link">Services</a></li>
            <li class="cs-li"><a href="/blog.html" class="cs-li-link cs-active">Blog</a></li>
            <li class="cs-li"><a href="/contact.html" class="cs-li-link">Contact</a></li>
          </ul>
        </div>
      </nav>
    </div>
  </header>

  <div id="banner-712">
    <div class="cs-container">
      <h1 class="cs-int-title">${post.title}</h1>
    </div>
    <picture class="cs-background">
      <source media="(max-width: 600px)" srcset="../images/banner_bg-360w.webp" type="image/webp">
      <source media="(min-width: 601px) and (max-width: 1024px)" srcset="../images/banner_bg-720w.webp" type="image/webp">
      <source media="(min-width: 1025px)" srcset="../images/banner_bg-1280w.webp" type="image/webp">
      <img decoding="async" src="../images/banner_bg.webp" alt="city skyline background" width="1920" height="634" aria-hidden="true">
    </picture>
  </div>

  ${breadcrumbHTML}

  <section id="content-page-715">
    <div class="cs-container">
      <div class="cs-content">
        ${post.cover_image ? `
        <div>
          <picture>
            <source media="(max-width: 600px)" srcset="${post.cover_image}">
            <source media="(min-width: 601px)" srcset="${post.cover_image}">
            <img loading="lazy" decoding="async" src="${post.cover_image}" alt="${post.title}" width="1920" height="1080">
          </picture>
        </div>` : ''}
        <h2 class="cs-title">${post.title}</h2>
        ${metaBar}
        ${post.content}
      </div>
    </div>
  </section>

  <footer id="cs-footer-1185">
    <img class="cs-graphic" aria-hidden="true" loading="lazy" decoding="async" src="../images/footer-v.svg" alt="logo" width="1920" height="163">
    <div id="cta-1185">
      <div class="cs-content">
        <h2 class="cs-title">Subscribe For More Info</h2>
        <form class="cs-form" name="Contact Form" method="post" id="subscribe-form">
          <label for="cs-email-1185" class="visually-hidden">Email Address</label>
          <input class="cs-input" type="email" id="cs-email-1185" name="find-us" placeholder="Email Address">
          <button class="cs-button-solid cs-submit" type="submit">Subscribe Now</button>
        </form>
      </div>
    </div>
    <div class="cs-container">
      <div class="cs-logo-group">
        <a aria-label="go back to home" class="cs-logo" href="/index.html">
          <img class="cs-logo-img" aria-hidden="true" loading="lazy" decoding="async" src="../images/europalp_logo_white.webp" alt="logo" width="200" height="65">
        </a>
        <p class="cs-text">
          Europa Luxury Properties provides full-service property management and real estate solutions in
          Dallas, Texas. We specialize in high-end residential, commercial, and investment properties,
          delivering excellence, transparency, and care.
        </p>
      </div>
      <ul class="cs-nav">
        <li class="cs-nav-li"><span class="cs-header">Quick Links</span></li>
        <li class="cs-nav-li"><a class="cs-nav-link" href="/index.html">Home</a></li>
        <li class="cs-nav-li"><a class="cs-nav-link" href="/about.html">About</a></li>
        <li class="cs-nav-li"><a class="cs-nav-link" href="/services.html">Services</a></li>
        <li class="cs-nav-li"><a class="cs-nav-link" href="/blog.html">Blog</a></li>
        <li class="cs-nav-li"><a class="cs-nav-link" href="/contact.html">Contact</a></li>
      </ul>
      <ul class="cs-nav">
        <li class="cs-nav-li"><span class="cs-header">Contact</span></li>
        <li class="cs-nav-li">
          <img class="cs-icon" src="../images/phone-stroke.svg" alt="phone" width="24" height="24">
          <a class="cs-nav-link cs-phone" href="tel:+17324394489">+1 (732) 439-4489</a>
        </li>
        <li class="cs-nav-li">
          <img class="cs-icon" src="../images/email-stroke.svg" alt="email" width="24" height="24">
          <a class="cs-nav-link cs-email" href="mailto:info@europalp.com">info@europalp.com</a>
        </li>
        <li class="cs-nav-li">
          <img class="cs-icon" src="../images/pin-stroke.svg" alt="pin" width="24" height="24">
          <a class="cs-nav-link cs-address" href="https://www.google.com/maps/place/Dallas,+TX" target="_blank" rel="noopener">
            Dallas, TX 75201<br>Serving All Surrounding Counties
          </a>
        </li>
      </ul>
    </div>
    <div class="cs-bottom">
      <div>
        <p>Powered By: <a href="https://redsurgetechnology.com/" target="_blank" class="cs-nav-link">Red Surge Technology</a></p>
      </div>
      <div>
        <a href="/privacy-policy.html" class="cs-nav-link">Privacy Policy</a>
        <span>|</span>
        <a href="/terms-of-use.html" class="cs-nav-link">Terms of Use</a>
      </div>
    </div>
    <picture class="cs-background">
      <source media="(max-width: 600px)" srcset="../images/footer_bg_img-360w.webp" type="image/webp">
      <source media="(min-width: 601px) and (max-width: 1024px)" srcset="../images/footer_bg_img-720w.webp" type="image/webp">
      <source media="(min-width: 1025px)" srcset="../images/footer_bg_img-1280w.webp" type="image/webp">
      <img loading="lazy" decoding="async" src="../images/footer_bg_img.webp" alt="wheels" width="1280" height="568">
    </picture>
  </footer>

  <script src="../js/index.js"></script>
  <script>
    document.getElementById('subscribe-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('cs-email-1185').value;
      try {
        const response = await fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, listIds: [4], updateEnabled: true })
        });
        if (response.ok) {
          alert("Thanks for subscribing!");
        } else {
          const errorData = await response.json();
          alert("Error: " + errorData.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert("An error occurred.");
      }
    });
  <\/script>
</body>
</html>`;
}

// Generate post pages — skip if handcrafted HTML already exists
posts.forEach(post => {
  const outPath = `./blog/${post.slug}.html`;
  if (fs.existsSync(outPath)) {
    console.log(`  ⏭️  Skipping blog/${post.slug}.html (already exists)`);
    return;
  }
  const html = generatePostHTML(post);
  fs.mkdirSync('./blog', { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`  📄 Generated blog/${post.slug}.html`);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function generateCardHTML(post) {
  const postUrl = `/blog/${post.slug}.html`;
  const publishedDate = new Date(post.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  return `
        <li class="cs-item">
          <picture class="cs-picture">
            <source media="(max-width: 600px)" srcset="${post.cover_image}">
            <source media="(min-width: 601px)" srcset="${post.cover_image}">
            <img loading="lazy" decoding="async" src="${post.cover_image}" alt="${post.title}" width="413" height="480">
          </picture>
          <div class="cs-info">
            <span class="cs-date">
              <img class="cs-icon" loading="lazy" decoding="async"
                src="https://csimg.nyc3.cdn.digitaloceanspaces.com/Icons/calendar.svg" alt="date" width="20" height="20">
              ${publishedDate}
            </span>
            <h3 class="cs-h3">${post.title}</h3>
            <span class="cs-desc">${post.excerpt || ''}</span>
            <a href="${postUrl}" class="cs-link">Read More</a>
          </div>
        </li>`;
}

function generateCardGroupsHTML(pagePosts) {
  const rows = chunkArray(pagePosts, 3);
  return rows.map(row => {
    const items = row.map(generateCardHTML).join('');
    const padding = row.length < 3
      ? Array(3 - row.length).fill(`<li class="cs-item" style="visibility:hidden"></li>`).join('')
      : '';
    return `\n        <ul class="cs-card-group">\n${items}\n${padding}\n        </ul>`;
  }).join('');
}

function generatePaginationHTML(currentPage, totalPages) {
  if (totalPages <= 1) return '';
  let links = '';
  for (let i = 1; i <= totalPages; i++) {
    const href = i === 1 ? '/blog.html' : `/blog-page-${i}.html`;
    const active = i === currentPage ? ' cs-active' : '';
    links += `<a href="${href}" class="cs-pagination-link${active}" aria-label="Page ${i}">${i}</a>`;
  }
  const prevHref = currentPage > 1 ? (currentPage === 2 ? '/blog.html' : `/blog-page-${currentPage - 1}.html`) : null;
  const nextHref = currentPage < totalPages ? `/blog-page-${currentPage + 1}.html` : null;
  return `
    <nav class="cs-pagination" aria-label="Blog pagination">
      ${prevHref ? `<a href="${prevHref}" class="cs-pagination-link cs-prev">← Prev</a>` : ''}
      ${links}
      ${nextHref ? `<a href="${nextHref}" class="cs-pagination-link cs-next">Next →</a>` : ''}
    </nav>`;
}

// ─── Update blog.html between markers ────────────────────────────────────────
const POSTS_PER_PAGE = 6;
const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
const blogTemplatePath = './blog.html';
const blogTemplate = fs.readFileSync(blogTemplatePath, 'utf8');

for (let page = 1; page <= totalPages; page++) {
  const pagePosts = posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);
  const cardGroupsHTML = generateCardGroupsHTML(pagePosts);
  const paginationHTML = generatePaginationHTML(page, totalPages);
  const fullHTML = `${cardGroupsHTML}\n${paginationHTML}`;

  let pageHTML = blogTemplate.replace(
    /<!-- CMS_POSTS_START -->[\s\S]*?<!-- CMS_POSTS_END -->/,
    `<!-- CMS_POSTS_START -->\n${fullHTML}\n        <!-- CMS_POSTS_END -->`
  );

  if (page === 1) {
    fs.writeFileSync(blogTemplatePath, pageHTML);
    console.log(`  📄 Updated blog.html (page 1 of ${totalPages})`);
  } else {
    fs.writeFileSync(`./blog-page-${page}.html`, pageHTML);
    console.log(`  📄 Generated blog-page-${page}.html`);
  }
}

console.log(`✅ Built ${posts.length} post(s) across ${totalPages} page(s).`);