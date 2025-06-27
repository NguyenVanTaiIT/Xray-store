// BrandSlideshow.jsx
import React, { useEffect, useRef } from 'react';
import styles from './BrandSlideshow.module.css';

const MSI = '/msi.png';

const BrandSlideshow = () => {
  const statsRef = useRef([]);

  useEffect(() => {
    // Intersection Observer for stats animation
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.animate);
          }
        });
      },
      { threshold: 0.5 }
    );

    statsRef.current.forEach((stat) => {
      if (stat) observer.observe(stat);
    });

    return () => observer.disconnect();
  }, []);

  const brands = [
  {
    name: "ASUS ROG",
    logo: "/asus.png",
    tagline: "Republic of Gamers"
  },
  {
    name: "MSI Gaming",
    logo: MSI,
    tagline: "Gaming Redefined"
  },
  {
    name: "Acer Predator",
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTw75gAuXijhZE9_tSHkAOc2oaOzAm71XF6nQ&s",
    tagline: "Unleash Your Gaming Potential"
  },
  {
    name: "Lenovo Legion",
    logo: "https://static1.xdaimages.com/wordpress/wp-content/uploads/2020/05/Lenovo-Legion.jpg",
    tagline: "Stylish Outside, Savage Inside"
  },
  {
    name: "Dell Alienware",
    logo: "/alien.png",
    tagline: "Born to Game"
  },
  {
    name: "Razer",
    logo: "/razer.png",
    tagline: "For Gamers. By Gamers."
  },
  {
    name: "Gigabyte AORUS",
    logo: "https://www.vortez.net/articles_file/27334_aorus-logo.png",
    tagline: "Team Up. Fight On."
  }
];

  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className={styles.brandSlideshowContainer}>
      <div className={styles.gradientOverlay}></div>
      
      <div className={styles.brandSlideshowHeader}>
        <h2 className={styles.brandTitle}>
          <span className={styles.brandTitleText}>Thương hiệu uy tín</span>
          <div className={styles.brandTitleGlow}></div>
        </h2>
        <p className={styles.brandSubtitle}>
          Đối tác chính thức của các thương hiệu gaming hàng đầu thế giới
        </p>
      </div>
      
      <div className={styles.brandSlideshowWrapper}>
        <div className={styles.brandSlideshowTrack}>
          {duplicatedBrands.map((brand, index) => (
            <div 
              key={index} 
              className={styles.brandSlide}
              style={{"--card-index": index}}
            >
              <div className={styles.brandCard}>
                <div className={styles.brandLogoContainer}>
                  <img 
                    src={brand.logo} 
                    alt={brand.name}
                    className={styles.brandLogo}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className={styles.brandLogoFallback} style={{display: 'none'}}>
                    <span className={styles.brandNameText}>{brand.name}</span>
                  </div>
                </div>
                <div className={styles.brandInfo}>
                  <h3 className={styles.brandName}>{brand.name}</h3>
                  <p className={styles.brandTagline}>{brand.tagline}</p>
                </div>
                <div className={styles.brandGlowEffect}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.brandStats}>
        {[
          { number: "8+", label: "Thương hiệu" },
          { number: "100%", label: "Chính hãng" },
          { number: "24/7", label: "Bảo hành" }
        ].map((stat, index) => (
          <div 
            key={index}
            ref={el => statsRef.current[index] = el}
            className={styles.statItem}
          >
            <div className={styles.statNumber}>{stat.number}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandSlideshow;