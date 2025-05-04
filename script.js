function init() {
  const page = window.location.pathname.split('/').pop();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const container     = document.getElementById('bubbles');
  const status        = document.getElementById('status');
  const shouldAnimate = window.innerWidth > 768 && !reducedMotion;
  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let popCount = 0;

  // Only run bubble animation on the home page (index.html or empty path)
  if ((page === 'index.html' || page === '') && shouldAnimate && container) {
    // Track pointer & pop bubbles
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      document.querySelectorAll('.bubble').forEach(b => {
        const rect = b.getBoundingClientRect();
        const bx = rect.left + rect.width / 2;
        const by = rect.top + rect.height / 2;
        const dist = Math.hypot(bx - mouseX, by - mouseY);
        if (dist < rect.width * 0.6 && !b.classList.contains('pop')) {
          b.classList.add('pop');
        }
      });
    });

    document.addEventListener('touchmove', e => {
      const t = e.touches[0];
      mouseX = t.clientX; mouseY = t.clientY;
    });

    // Announce and remove popped bubbles
    container.addEventListener('transitionend', e => {
      if (e.target.classList.contains('pop')) {
        container.removeChild(e.target);
        status.textContent = `${++popCount} bubbles popped`;
      }
    });

    // Spawn bubbles every 600ms and stop after 6 seconds
    const bubbleInterval = setInterval(() => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      const size = 50 + Math.random() * 100;
      bubble.style.width  = bubble.style.height = `${size}px`;
      bubble.style.left   = `${Math.random() * 100}%`;
      container.appendChild(bubble);
      setTimeout(() => {
        if (container.contains(bubble)) container.removeChild(bubble);
      }, 8000);
    }, 600);

    // Clear the interval after 6 seconds to stop spawning new bubbles
    setTimeout(() => clearInterval(bubbleInterval), 6000);
  }

  // Smooth-scroll nav links
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      // Only prevent default and smooth scroll if it's a same-page link
      if (href.startsWith('#')) {
        e.preventDefault();
        const tgt = document.querySelector(href);
        tgt && tgt.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Flip-card keyboard & click support
  const flipContainer = document.querySelector('.hero-image-container');
  if (flipContainer) {
    flipContainer.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        flipContainer.classList.toggle('flipped');
      }
    });
    flipContainer.addEventListener('click', () => {
      flipContainer.classList.toggle('flipped');
    });
  }

  // Animate sections into view
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.section').forEach(sec => {
    observer.observe(sec);
  });
}

// Modal popup for logo blocks
function createModal({ title, body, cover, slides }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;
  let currentSlide = 0;
  function renderSlides() {
    // Add a special class for Escape (YC23) modal
    const isEscape = title === 'Escape (YC23)';
    return `
      <div class="modal-slider">
        <button class="slider-arrow left" ${currentSlide === 0 ? 'disabled' : ''}>&lt;</button>
        <div class="slider-image-wrapper${isEscape ? ' escape-cover' : ''}" id="slider-image-wrapper">
          <img src="${slides[currentSlide] || cover}" alt="Slide ${currentSlide + 1}" class="slider-image${isEscape ? ' escape-cover' : ''}" />
        </div>
        <button class="slider-arrow right" ${currentSlide === slides.length - 1 ? 'disabled' : ''}>&gt;</button>
      </div>
      <div class="slider-indicator">${currentSlide + 1} / ${slides.length}</div>
    `;
  }
  function renderModal() {
    modalRoot.innerHTML = `
      <div class="modal-overlay" tabindex="-1">
        <div class="modal" role="dialog" aria-modal="true">
          <button class="modal-close" aria-label="Close modal">&times;</button>
          <div class="modal-title">${title}</div>
          ${slides && slides.length ? renderSlides() : ''}
          <div class="modal-body">${body}</div>
        </div>
      </div>
    `;
    // Add event listeners for slider arrows
    const left = modalRoot.querySelector('.slider-arrow.left');
    const right = modalRoot.querySelector('.slider-arrow.right');
    if (left) left.addEventListener('click', () => { if (currentSlide > 0) { currentSlide--; renderModal(); } });
    if (right) right.addEventListener('click', () => { if (currentSlide < slides.length - 1) { currentSlide++; renderModal(); } });
    // Close logic
    const overlay = modalRoot.querySelector('.modal-overlay');
    const closeBtn = modalRoot.querySelector('.modal-close');
    function closeModal() { modalRoot.innerHTML = ''; }
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function escListener(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', escListener); }
    });
    setTimeout(() => {
      const imgWrapper = modalRoot.querySelector('.slider-image-wrapper');
      if (imgWrapper) {
        imgWrapper.addEventListener('click', () => {
          createEnlargedImageModal(slides[currentSlide]);
        });
      }
    }, 0);
  }
  renderModal();
}

function createEnlargedImageModal(imageSrc) {
  // Create a dedicated overlay outside of modal-root to avoid interfering with the main modal
  let overlay = document.getElementById('enlarged-modal-overlay');
  if (overlay) overlay.remove(); // Remove any existing
  overlay = document.createElement('div');
  overlay.className = 'enlarged-modal-overlay';
  overlay.id = 'enlarged-modal-overlay';
  overlay.tabIndex = -1;
  overlay.innerHTML = `
    <div class="enlarged-modal">
      <button class="enlarged-modal-close" aria-label="Close enlarged image">&times;</button>
      <img src="${imageSrc}" alt="Enlarged slide image" />
    </div>
  `;
  document.body.appendChild(overlay);
  const closeBtn = overlay.querySelector('.enlarged-modal-close');
  function closeModal() {
    overlay.remove();
    document.removeEventListener('keydown', escListener);
  }
  function escListener(e) {
    if (e.key === 'Escape') closeModal();
  }
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', escListener);
}

function setupLogoPopups() {
  const logos = document.querySelectorAll('.logo-block');
  // Determine which page we're on
  const page = window.location.pathname.split('/').pop();
  let data = [];
  if (page === 'professional.html') {
    data = [
      {
        title: 'Impact Immersive',
        body: `<p>At Impact Immersive, I worked closely with founder Susan Oslin to unify the company's branding and messaging, addressing the challenge of communicating the value of AR to sustainability-focused organizations, many of which were unfamiliar with new technology.</p><p>Through market and competitor analysis, I helped create branding guidelines that informed a consistent social media presence and developed visual assets for both online use and in-person booths.</p><p>These initiatives clarified our offerings, made the concept of AR more accessible, and strengthened our appeal to potential clients, resulting in increased booth engagement and the formation of key partnerships with major organizations like LA Water and Power, Folar, Ca Native Plant Society for our upcoming app launch.</p>`,
        cover: 'assets/professional/impact-immersive/cover.png',
        slides: [
          'assets/professional/impact-immersive/slide1.png',
          'assets/professional/impact-immersive/slide2.png',
          'assets/professional/impact-immersive/slide3.png',
          'assets/professional/impact-immersive/slide4.png'
        ]
      },
      {
        title: 'American Heart Association',
        body: `<p>While assisting with managing the social media channels for the Western states (Instagram, Facebook, X), I collaborated with the marketing team on a larger influencer campaign featuring Damar Hamlin.</p><p>My role involved creating editorial calendars, uploading assets to content portals, posting paid ads through Meta ads, setting minimum spends, and tracking engagement rates. I actively monitored campaign performance, reallocating funds to higher-performing ad variations to optimize results and maximize the campaign's impact and boost engagement by 10%.</p><p>The links below direct you to the campaign initiative on the American Heart Association (AHA) website, as well as a video showcasing one of the ad variations used in the campaign.</p>

<div class="link-preview-card">
  <a href="https://www.youtube.com/watch?v=Dqp5JaWfrrA" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Ad Variation</div>
      <div class="link-preview-desc">Watch the campaign ad on YouTube</div>
    </div>
  </a>
</div>
<div class="link-preview-card">
  <a href="https://www.heart.org/en/damar-hamlins-3-for-heart-cpr-challenge" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">AHA Website</div>
      <div class="link-preview-desc">See the official campaign page</div>
    </div>
  </a>
</div>`,
        cover: 'assets/professional/american-heart/American-Heart-Association-Emblem.png',
        slides: [] // No slideshow for this popup
      },
      {
        title: 'Escape (YC23)',
        body: '',
        cover: 'escape.png',
        slides: []
      }
    ];
  } else if (page === 'academic.html') {
    data = [
      {
        title: 'GPT Health and Wellness Agent',
        body: `<p>For my Machine Learning in Natural Language capstone project, I worked alongside a small team to develop a chatbot specializing in health and personalized nutrition plans using LLMs.</p><p>The project involved leveraging LLMs to analyze medical research, nutritional data, and fitness guides to offer customized diet plans, workout routines, and wellness tips based on individual user preferences, health conditions, and goals. I fine-tuned a GPT model to enhance the chatbot's focus on wellness and mental health. Additionally, I conducted an online search to identify 15 websites providing related services and advice, storing the names and descriptions in a JSON file, and used cosine similarity to present the most relevant website to users.</p><p>We presented the project to our professor and leaders in the school of engineering alongside a plan on what a business leveraging this technology could look like. My roles included, training the model, and writing the code for the online search, as well as conducting a SWOT analysis. I've linked both the Github Repository as well as a Google Folder with the full deck below.</p>

<div class="link-preview-card">
  <a href="https://github.com/christohmg/GPT-Health-and-Wellness-Chatbot" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Github Repository</div>
      <div class="link-preview-desc">View the code and documentation</div>
    </div>
  </a>
</div>
<div class="link-preview-card">
  <a href="https://drive.google.com/file/d/1WD6M07pTUSHnIBUpyP6_x28dBHzk9PYF/view" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Presentation</div>
      <div class="link-preview-desc">View the full project deck</div>
    </div>
  </a>
</div>`,
        cover: 'chatbotcover.png',
        slides: [
          'chatbotpresentation1.png',
          'chatbotpresentation2.png',
          'chatbotpresentation3.png'
        ]
      },
      {
        title: 'STEM Disintermedia GTM Strategy',
        body: `<p>The STEM team approached our class with several marketing challenges, and my group provided recommendations on leveraging artists for their marketing, exploring new mediums, and incorporating a social media tool for managing KPIs. I focused specifically on new mediums, particularly podcasts, as the team aimed to disrupt the industry and establish thought leadership. Given their CEO's existing following, I suggested appearing on the "Fintech Thought Leaders" podcast for the launch of their new tool, Tone. This recommendation was well received and sparked discussions on music payment processes, which aligns with Tone's goal of addressing these issues.</p>

<div class="link-preview-card">
  <a href="https://drive.google.com/file/d/1GqaiiDiMo01AIjB5BLt95LX-n0p_ZUNq/view" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Presentation</div>
      <div class="link-preview-desc">View the full project deck</div>
    </div>
  </a>
</div>
<div class="link-preview-card">
  <a href="https://www.qedinvestors.com/blog/podcast-one-on-one-with-stem-ceo-milana-lewis" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">STEM on Fintech Thought Leaders Podcast</div>
      <div class="link-preview-desc">Listen to the podcast episode</div>
    </div>
  </a>
</div>`,
        cover: 'stemcover.png',
        slides: []
      },
      {
        title: 'Riot Games 2XKO (Formerly Project-L) Marketing Launch Plan',
        body: `<p>For my Marketing in Gaming Capstone Project, we developed a go-to-market strategy for Riot Games' 2XKO, formerly known as Project L. After conducting a thorough analysis and researching the market, our strategy centered on the Chinese market due to its profitability, along with approaches to ensure a sustained player base. My contributions focused on market and industry analysis, as well as defining target markets and audience segmentation.</p>

<div class="link-preview-card">
  <a href="https://drive.google.com/file/d/1TDLjA1j9xwRxdBxExuFhrru90o851D5f/view" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Presentation</div>
      <div class="link-preview-desc">View the full project deck</div>
    </div>
  </a>
</div>`,
        cover: 'projectlcover.png',
        slides: []
      },
      {
        title: 'Academic Project One',
        body: 'This is a placeholder for an academic project. Replace with your own content.',
        cover: 'placeholder1.png',
        slides: ['placeholder1.png', 'placeholder2.png']
      },
      {
        title: 'Academic Project Two',
        body: 'This is a placeholder for an academic project. Replace with your own content.',
        cover: 'placeholder2.png',
        slides: ['placeholder2.png', 'placeholder3.png']
      },
      {
        title: 'Academic Project Three',
        body: 'This is a placeholder for an academic project. Replace with your own content.',
        cover: 'placeholder3.png',
        slides: ['placeholder3.png', 'placeholder1.png']
      }
    ];
  } else if (page === 'code.html') {
    data = [
      {
        title: 'This Website',
        body: `<p>Thank you my intro to Python class and Cursor AI.</p>`,
        cover: 'thiswebsite.png',
        slides: []
      },
      {
        title: 'Image Resolution with Autoencoders',
        body: `<p>This project leverages autoencoders to enhance image resolution, focusing on a dataset of flamingo images. i started off by resizing high-resolution images to lower resolutions and then using an autoencoder model to improve image clarity. I utilized techniques like early stopping, checkpointing, and learning rate adjustments to refine the model's performance. Model output could be improved though …</p>
<div class="link-preview-card">
  <a href="https://github.com/christohmg/Image-Resolution-with-Autoencoders-/tree/main" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Github Repository</div>
      <div class="link-preview-desc">View the code and documentation</div>
    </div>
  </a>
</div>`,
        cover: 'imagerescover.png',
        slides: [
          'imageresppt1.png',
          'imageresppt2.png'
        ]
      },
      {
        title: 'Code Project One',
        body: 'This is a placeholder for a code project. Replace with your own content.',
        cover: 'placeholder1.png',
        slides: ['placeholder1.png', 'placeholder2.png']
      },
      {
        title: 'Code Project Two',
        body: 'This is a placeholder for a code project. Replace with your own content.',
        cover: 'placeholder2.png',
        slides: ['placeholder2.png', 'placeholder3.png']
      },
      {
        title: 'Code Project Three',
        body: 'This is a placeholder for a code project. Replace with your own content.',
        cover: 'placeholder3.png',
        slides: ['placeholder3.png', 'placeholder1.png']
      }
    ];
  } else if (page === 'personal.html') {
    data = [
      {
        title: 'Vacation!',
        body: `<p>Video compilations of some of my recent travels all done on Canva- I have gotten really good at creating content (video, images, etc) on Canva thanks to personal projects such as these</p>
<div class="link-preview-card">
  <a href="https://drive.google.com/file/d/1dj6R6cjdlYxMIujjX2BMXzyPxzCPFoiW/view" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">Oahu2024</div>
      <div class="link-preview-desc">View the video compilation</div>
    </div>
  </a>
</div>
<div class="link-preview-card">
  <a href="https://drive.google.com/file/d/1opfhvdQpRHCQEUeJyQLnNlaOauFnoWgB/view" target="_blank" rel="noopener">
    <div>
      <div class="link-preview-title">PCHDrive</div>
      <div class="link-preview-desc">View the video compilation</div>
    </div>
  </a>
</div>`,
        cover: 'personal.png',
        slides: []
      }
    ];
  }
  logos.forEach((logo, idx) => {
    logo.addEventListener('click', () => {
      createModal(data[idx] || data[0]);
    });
  });
}

// Initialize after DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    setupLogoPopups();
  });
} else {
  init();
  setupLogoPopups();
}


