import React from 'react';
import VIETNAM_ADDRESS_DATA from '../utils/vietnamAddress.json';
import styles from './LocationSelector.module.css';

export default function LocationSelector({ formData, setFormData, errors = {} }) {
  // Đảm bảo formData có các trường cần thiết
  const initialFormData = {
    city: formData.city || '',
    district: formData.district || '',
    ward: formData.ward || '',
    zipCode: formData.zipCode || ''
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'city') {
      setFormData({
        ...initialFormData,
        city: value,
        district: '',
        ward: ''
      });
    } else if (name === 'district') {
      setFormData({
        ...initialFormData,
        district: value,
        ward: ''
      });
    } else {
      setFormData({
        ...initialFormData,
        [name]: value
      });
    }
  };

  // Tìm thành phố từ tên
  const selectedCity = VIETNAM_ADDRESS_DATA.find(c => c.Name === initialFormData.city) || { Districts: [] };
  const districts = selectedCity.Districts || [];

  // Tìm quận/huyện từ tên
  const selectedDistrict = districts.find(d => d.Name === initialFormData.district) || { Wards: [] };
  const wards = selectedDistrict.Wards || [];



  return (
    <div className={styles.formRow}>
      {/* City Select */}
      <div className={styles.fieldWrapper}>
        <select
          name="city"
          value={initialFormData.city}
          onChange={handleChange}
          className={`${styles.formSelect} ${errors.city ? styles.inputError : ''}`}
        >
          <option value="" className={styles.option}>
            Chọn Tỉnh/Thành phố *
          </option>
          {VIETNAM_ADDRESS_DATA.map(city => (
            <option key={city.Id} value={city.Name} className={styles.option}>
              {city.Name}
            </option>
          ))}
        </select>
        {errors.city && <span className={styles.errorText}>{errors.city}</span>}
      </div>

      {/* District Select */}
      <div className={styles.fieldWrapper}>
        <select
          name="district"
          value={initialFormData.district}
          onChange={handleChange}
          className={`${styles.formSelect} ${errors.district ? styles.inputError : ''} ${!initialFormData.city ? styles.disabled : ''}`}
          disabled={!initialFormData.city}
        >
          <option value="" className={styles.option}>
            Chọn Quận/Huyện *
          </option>
          {districts.map(district => (
            <option key={district.Id} value={district.Name} className={styles.option}>
              {district.Name}
            </option>
          ))}
        </select>
        {errors.district && <span className={styles.errorText}>{errors.district}</span>}
      </div>

      {/* Ward Select */}
      <div className={styles.fieldWrapper}>
        <select
          name="ward"
          value={initialFormData.ward}
          onChange={handleChange}
          className={`${styles.formSelect} ${errors.ward ? styles.inputError : ''} ${!initialFormData.district ? styles.disabled : ''}`}
          disabled={!initialFormData.district}
        >
          <option value="" className={styles.option}>
            Chọn Phường/Xã *
          </option>
          {wards.map(ward => (
            <option key={ward.Id} value={ward.Name} className={styles.option}>
              {ward.Name}
            </option>
          ))}
        </select>
        {errors.ward && <span className={styles.errorText}>{errors.ward}</span>}
      </div>

      {/* ZipCode Input */}
      <div className={styles.fieldWrapper}>
        <input
          type="text"
          name="zipCode"
          value={initialFormData.zipCode}
          onChange={handleChange}
          className={`${styles.formInput} ${errors.zipCode ? styles.inputErrorInput : ''}`}
          placeholder="Mã bưu điện"
        />
        {errors.zipCode && <span className={styles.errorText}>{errors.zipCode}</span>}
      </div>
    </div>
  );
}