// src/pages/UserPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NoticeSection from '../components/NoticeSection';

export default function UserPage() {
  const navigate = useNavigate();
  
  // 원본 데이터와 화면 표시 데이터를 분리하여 관리
  const [cafeterias, setCafeterias] = useState([]); // 원본 (API 응답)
  const [displayList, setDisplayList] = useState([]); // 화면 표시용 (검색/정렬 후)
  const [loading, setLoading] = useState(true);
  
  const [keyword, setKeyword] = useState("");
  const [sortBy, setSortBy] = useState("default"); // 정렬 상태

  // 1. 식당 데이터 불러오기 (API 호출)
  const fetchCafeterias = async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = searchQuery 
        ? `http://localhost:8000/api/cafeterias/?q=${searchQuery}`
        : 'http://localhost:8000/api/cafeterias/';
      
      const response = await axios.get(url);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      
      setCafeterias(data);
      setDisplayList(data); // 초기에는 원본 그대로 표시
      
      // 데이터를 새로 불러오면 정렬 상태도 초기화
      setSortBy("default"); 

    } catch (error) {
      console.error("식당 목록 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafeterias();
  }, []);

  // 2. 검색 핸들러
  const handleSearch = () => {
    fetchCafeterias(keyword);
  };

  // 3. 정렬 핸들러 (프론트엔드에서 정렬 수행)
  const handleSort = (type) => {
    setSortBy(type);
    let sorted = [...displayList]; // 현재 보여지는 리스트 복사

    if (type === 'default') {
      // 기본 정렬 (ID순 또는 이름순)
      sorted.sort((a, b) => a.id - b.id);
    } 
    else if (type === 'rating') {
      // 별점순 (avg_rating 필드가 있다고 가정)
      sorted.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      if (!sorted[0]?.avg_rating) alert("현재 식당 목록에는 별점 데이터가 포함되어 있지 않습니다.");
    } 
    else if (type === 'review') {
      // 리뷰순 (review_count 필드가 있다고 가정)
      sorted.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      if (!sorted[0]?.review_count) alert("현재 식당 목록에는 리뷰 수 데이터가 포함되어 있지 않습니다.");
    }
    
    setDisplayList(sorted);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>로딩 중... ⏳</div>;

  return (
    <div>
      {/* 배너 & 검색창 */}
      <div className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">DKU BAB</h1>
          <div className="search-box">
            <input 
              type="text" className="search-input" 
              placeholder="식당 이름 또는 위치 검색" 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
            />
            <button className="search-btn" onClick={handleSearch}>검색</button>
          </div>
        </div>
      </div>
    {/* 공지사항 섹션 */}
    <NoticeSection />
      {/* [추가] 필터 버튼 바 */}
      <div className="filter-bar">
        <div className="filter-container">
          <button 
            className={`filter-btn ${sortBy === 'default' ? 'active' : ''}`} 
            onClick={() => handleSort('default')}
          >
            🏛️ 전체 식당
          </button>
          <button 
            className={`filter-btn ${sortBy === 'rating' ? 'active' : ''}`} 
            onClick={() => handleSort('rating')}
          >
            ⭐ 별점순
          </button>
          <button 
            className={`filter-btn ${sortBy === 'review' ? 'active' : ''}`} 
            onClick={() => handleSort('review')}
          >
            📝 리뷰 많은 순
          </button>
        </div>
      </div>

      {/* 식당 리스트 */}
      <div className="restaurant-grid">
        {displayList.length > 0 ? (
          displayList.map((res) => (
            <div 
                key={res.id} 
                className="res-card" 
                onClick={() => navigate(`/restaurant/${res.id}`)} 
                style={{ cursor: 'pointer' }}
            >
              {/* [수정된 부분] 식당 이미지 영역 */}
              <div className="res-img-placeholder" style={{ 
                  height: '150px',                // 이미지 높이 고정
                  backgroundColor: '#f0f2f5',     // 이미지가 없을 때 배경색
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  overflow: 'hidden',             // 이미지가 넘치면 자르기
                  borderRadius: '12px 12px 0 0',  // 위쪽 모서리만 둥글게
                  color: '#999',                  // 텍스트 색상
                  fontSize: '1rem'                // 텍스트 크기
              }}>
                {res.image ? (
                  <img 
                    src={res.image} 
                    alt={res.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  "사진 없음"
                )}
              </div>
              {/* 수정 끝 */}

              <div className="res-info">
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '10px'}}>
                    <h3 style={{margin: '0', fontSize: '1.2rem'}}>{res.name}</h3>
                    
                    {/* 별점/리뷰 정보가 있으면 표시, 없으면 상세보기 버튼 표시 */}
                    {(res.avg_rating || res.review_count) ? (
                        <div style={{fontSize:'0.9rem'}}>
                            <span style={{ color: '#fbc02d', fontWeight: 'bold' }}>
                              ⭐ {Number(res.avg_rating ?? 0).toFixed(1)}
                            </span>
                            <span style={{color:'#aaa', marginLeft:'5px'}}>({res.review_count || 0})</span>
                        </div>
                    ) : (
                        <span style={{fontSize: '0.8rem', color: '#007bff', border:'1px solid #007bff', padding:'2px 6px', borderRadius:'4px'}}>
                            상세보기
                        </span>
                    )}
                </div>
                <p style={{color: '#555', fontSize: '0.9rem', margin: '5px 0'}}>
                  📍 {res.location || "위치 정보 없음"}
                </p>
                <p style={{color: '#888', fontSize: '0.9rem', margin: '0'}}>
                  ⏰ {res.operating_hours || "운영 시간 미정"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div style={{textAlign:'center', width:'100%', padding:'50px', gridColumn: '1 / -1'}}>
            <h3 style={{color: '#555'}}>검색 결과가 없습니다. 😳</h3>
          </div>
        )}
      </div>
    </div>
  );
}