import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import styles from './AboutUs.module.css';

export default function AboutUs() {
  return (
    <div className={styles.aboutContainer}>
      <Header />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div>
            <h1 className={styles.heroTitle}>Giới thiệu về chúng tôi</h1>
            <p className={styles.heroSubtitle}>Chào mừng bạn đến với cửa hàng laptop hàng đầu Việt Nam</p>
          </div>
        </section>

        {/* Company Story */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Câu chuyện của chúng tôi</h2>
            <div className={`${styles.contentCard} ${styles.fadeInUp}`}>
              <p className={styles.contentText}>
                Được thành lập từ năm 2015, chúng tôi bắt đầu với một tầm nhìn đơn giản: 
                mang đến cho khách hàng những chiếc laptop chất lượng cao với giá cả hợp lý. 
                Qua nhiều năm phát triển, chúng tôi đã trở thành một trong những cửa hàng 
                laptop uy tín nhất tại Việt Nam.
              </p>
              <p className={styles.contentText}>
                Từ một cửa hàng nhỏ với đội ngũ chỉ 3 người, chúng tôi đã phát triển thành 
                một hệ thống với hơn 20 cửa hàng trên toàn quốc và đội ngũ nhân viên gần 200 người. 
                Sự phát triển này không chỉ đến từ chất lượng sản phẩm mà còn từ sự tận tâm 
                phục vụ khách hàng.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Sứ mệnh & Tầm nhìn</h2>
            <div className={styles.missionVisionGrid}>
              <div className={`${styles.missionCard} ${styles.fadeInUp} ${styles['stagger-1']}`}>
                <h3 className={styles.missionTitle}>Sứ mệnh</h3>
                <p className={styles.contentText}>
                  Cung cấp các sản phẩm laptop chất lượng cao, dịch vụ tốt nhất và 
                  tư vấn chuyên nghiệp để giúp khách hàng tìm được chiếc laptop phù hợp 
                  nhất với nhu cầu sử dụng của mình.
                </p>
              </div>
              <div className={`${styles.visionCard} ${styles.fadeInUp} ${styles['stagger-2']}`}>
                <h3 className={styles.visionTitle}>Tầm nhìn</h3>
                <p className={styles.contentText}>
                  Trở thành cửa hàng laptop số 1 Việt Nam về chất lượng sản phẩm, 
                  dịch vụ khách hàng và trải nghiệm mua sắm, đồng thời mở rộng 
                  ra thị trường khu vực Đông Nam Á.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Giá trị cốt lõi</h2>
            <div className={styles.valuesGrid}>
              <div className={`${styles.valueCard} ${styles.fadeInUp} ${styles['stagger-1']}`}>
                <h4 className={styles.valueTitle}>Chất lượng</h4>
                <p className={styles.valueText}>
                  Chúng tôi cam kết chỉ bán những sản phẩm chất lượng cao từ các thương hiệu uy tín.
                </p>
              </div>
              <div className={`${styles.valueCard} ${styles.fadeInUp} ${styles['stagger-2']}`}>
                <h4 className={styles.valueTitle}>Tin cậy</h4>
                <p className={styles.valueText}>
                  Xây dựng lòng tin với khách hàng thông qua sự minh bạch và trung thực.
                </p>
              </div>
              <div className={`${styles.valueCard} ${styles.fadeInUp} ${styles['stagger-3']}`}>
                <h4 className={styles.valueTitle}>Dịch vụ</h4>
                <p className={styles.valueText}>
                  Đặt khách hàng làm trung tâm, luôn lắng nghe và hỗ trợ tốt nhất.
                </p>
              </div>
              <div className={`${styles.valueCard} ${styles.fadeInUp} ${styles['stagger-4']}`}>
                <h4 className={styles.valueTitle}>Đổi mới</h4>
                <p className={styles.valueText}>
                  Không ngừng cải tiến để mang đến trải nghiệm mua sắm tốt nhất.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Tại sao chọn chúng tôi?</h2>
            <div className={styles.whyChooseGrid}>
              <div className={`${styles.chooseCard} ${styles.fadeInUp} ${styles['stagger-1']}`}>
                <h4 className={styles.chooseTitle}>Sản phẩm đa dạng</h4>
                <p className={styles.chooseText}>
                  Hơn 500 mẫu laptop từ các thương hiệu hàng đầu như Dell, HP, Lenovo, Asus, Acer, MSI...
                </p>
              </div>
              <div className={`${styles.chooseCard} ${styles.fadeInUp} ${styles['stagger-2']}`}>
                <h4 className={styles.chooseTitle}>Giá cả cạnh tranh</h4>
                <p className={styles.chooseText}>
                  Cam kết giá tốt nhất thị trường với nhiều chương trình khuyến mãi hấp dẫn.
                </p>
              </div>
              <div className={`${styles.chooseCard} ${styles.fadeInUp} ${styles['stagger-3']}`}>
                <h4 className={styles.chooseTitle}>Bảo hành uy tín</h4>
                <p className={styles.chooseText}>
                  Chế độ bảo hành chính hãng từ 12-36 tháng, hỗ trợ sửa chữa tận nơi.
                </p>
              </div>
              <div className={`${styles.chooseCard} ${styles.fadeInUp} ${styles['stagger-4']}`}>
                <h4 className={styles.chooseTitle}>Tư vấn chuyên nghiệp</h4>
                <p className={styles.chooseText}>
                  Đội ngũ nhân viên am hiểu sản phẩm, tư vấn nhiệt tình và chuyên nghiệp.
                </p>
              </div>
              <div className={`${styles.chooseCard} ${styles.fadeInUp} ${styles['stagger-5']}`}>
                <h4 className={styles.chooseTitle}>Giao hàng nhanh</h4>
                <p className={styles.chooseText}>
                  Giao hàng toàn quốc trong 24h, miễn phí vận chuyển cho đơn hàng trên 10 triệu.
                </p>
              </div>
              <div className={`${styles.chooseCard} ${styles.fadeInUp} ${styles['stagger-6']}`}>
                <h4 className={styles.chooseTitle}>Hỗ trợ sau bán</h4>
                <p className={styles.chooseText}>
                  Hotline 24/7, hỗ trợ kỹ thuật và giải đáp thắc mắc mọi lúc.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Đội ngũ của chúng tôi</h2>
            <div className={`${styles.contentCard} ${styles.fadeInUp}`}>
              <p className={styles.contentText}>
                Với đội ngũ gần 200 nhân viên giàu kinh nghiệm, chúng tôi tự hào có các chuyên gia 
                am hiểu sâu sắc về công nghệ laptop. Từ nhân viên tư vấn, kỹ thuật viên sửa chữa 
                đến đội ngũ chăm sóc khách hàng, tất cả đều được đào tạo bài bản và thường xuyên 
                cập nhật kiến thức về các sản phẩm mới nhất.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Liên hệ với chúng tôi</h2>
            <div className={styles.contactGrid}>
              <div className={`${styles.contactCard} ${styles.fadeInUp} ${styles['stagger-1']}`}>
                <h4 className={styles.contactTitle}>Địa chỉ trụ sở chính</h4>
                <p className={styles.contactText}>123 Đường Nguyễn Văn Cừ, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className={`${styles.contactCard} ${styles.fadeInUp} ${styles['stagger-2']}`}>
                <h4 className={styles.contactTitle}>Hotline</h4>
                <p className={styles.contactText}>1900 1234 (24/7)</p>
              </div>
              <div className={`${styles.contactCard} ${styles.fadeInUp} ${styles['stagger-3']}`}>
                <h4 className={styles.contactTitle}>Email</h4>
                <p className={styles.contactText}>contact@laptopstore.vn</p>
              </div>
              <div className={`${styles.contactCard} ${styles.fadeInUp} ${styles['stagger-4']}`}>
                <h4 className={styles.contactTitle}>Website</h4>
                <p className={styles.contactText}>www.laptopstore.vn</p>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className={styles.section}>
          <div>
            <h2 className={styles.sectionTitle}>Số liệu ấn tượng</h2>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.fadeInUp} ${styles['stagger-1']}`}>
                <h3 className={styles.statNumber}>8+</h3>
                <p className={styles.statLabel}>Năm kinh nghiệm</p>
              </div>
              <div className={`${styles.statCard} ${styles.fadeInUp} ${styles['stagger-2']}`}>
                <h3 className={styles.statNumber}>20+</h3>
                <p className={styles.statLabel}>Cửa hàng toàn quốc</p>
              </div>
              <div className={`${styles.statCard} ${styles.fadeInUp} ${styles['stagger-3']}`}>
                <h3 className={styles.statNumber}>50K+</h3>
                <p className={styles.statLabel}>Khách hàng tin tưởng</p>
              </div>
              <div className={`${styles.statCard} ${styles.fadeInUp} ${styles['stagger-4']}`}>
                <h3 className={styles.statNumber}>500+</h3>
                <p className={styles.statLabel}>Mẫu laptop đa dạng</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}