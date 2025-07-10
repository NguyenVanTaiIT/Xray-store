import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchProducts } from '../services/productService';
import styles from './SearchResults.module.css';
import Headers from '../pages/Header/Header';

// Component hiển thị từng sản phẩm với thiết kế tương tự Home
const ProductCard = ({ product }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/product-detail/${product._id}`);
    };

    return (
        <div className={styles.card} onClick={handleClick}>
            <div>
                <img
                    src={product.image || 'https://via.placeholder.com/300x200'}
                    alt={product.name}
                    className={styles.image}
                    onError={(e) => {
                        e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23333"/%3E%3Ctext x="150" y="100" text-anchor="middle" fill="%23666" font-family="Arial" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
                    }}
                />
                <div className={styles.info}>
                    <h3 className={styles.name}>{product.name}</h3>
                    <p className={styles.price}>{product.price.toLocaleString()}₫</p>
                    <p className={styles.stock}>
                        {product.inStock ? '✓ Còn hàng' : '✗ Hết hàng'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function SearchResults() {
    const { search } = useLocation();
    const query = new URLSearchParams(search).get('q') || '';
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await fetchProducts(undefined, undefined, undefined, 1, 100);
                const filtered = res.products.filter(p =>
                    p.name.toLowerCase().includes(query.toLowerCase())
                );
                setProducts(filtered);
            } catch (err) {
                console.error('Search failed:', err);
                setError('Không thể tải dữ liệu. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            load();
        } else {
            setProducts([]);
            setLoading(false);
        }
    }, [query]);

    return (
        <>
            <Headers />
            <div className={styles.searchResults}>
                <h2>Kết quả tìm kiếm cho: "{query}"</h2>

                {loading ? (
                    <div className={styles.loadingState}>
                        <p>Đang tải...</p>
                    </div>
                ) : error ? (
                    <div className={styles.errorState}>
                        <p>{error}</p>
                    </div>
                ) : !query ? (
                    <p>Vui lòng nhập từ khóa tìm kiếm.</p>
                ) : products.length === 0 ? (
                    <p>Không tìm thấy sản phẩm phù hợp với từ khóa "{query}".</p>
                ) : (
                    <>
                        <p>Tìm thấy {products.length} sản phẩm</p>
                        <div className={styles.grid}>
                            {products.map(product => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}