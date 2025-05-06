import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';

const ImageConverter = () => {
    const [files, setFiles] = useState([]);
    const [convertedBlobs, setConvertedBlobs] = useState([]);
    const [targetFormat, setTargetFormat] = useState('png');
    const [isDragging, setIsDragging] = useState(false);

    const convertImage = (file) => {
        return new Promise((resolve) => {
            const img = new Image();
            const reader = new FileReader();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, `image/${targetFormat}`);
            };

            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);
        
        // 处理文件拖拽
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            file => file.type.startsWith('image/')
        );
        
        // 处理图片URL拖拽
        const items = Array.from(e.dataTransfer.items);
        const imageItems = items.filter(item => 
            item.type === 'text/uri-list' || 
            item.type.startsWith('image/')
        );
        
        const newFiles = [];
        
        for (const item of imageItems) {
            if (item.type === 'text/uri-list') {
                const url = await new Promise(resolve => {
                    item.getAsString(resolve);
                });
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    if (blob.type.startsWith('image/')) {
                        const file = new File([blob], url.split('/').pop(), { type: blob.type });
                        newFiles.push(file);
                    }
                } catch (error) {
                    console.error('Failed to fetch image:', url);
                }
            } else if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) newFiles.push(file);
            }
        }
        
        if (droppedFiles.length > 0 || newFiles.length > 0) {
            setFiles(prev => [...prev, ...droppedFiles, ...newFiles]);
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files).filter(
            file => file.type.startsWith('image/')
        );
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const handleConvertAll = async () => {
        const converted = await Promise.all(
            files.map(file => convertImage(file))
        );
        setConvertedBlobs(converted);
    };

    const handleDownloadZip = async () => {
        if (convertedBlobs.length === 0) return;

        const zip = new JSZip();
        convertedBlobs.forEach((blob, i) => {
            zip.file(`converted_${i + 1}.${targetFormat}`, blob);
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `converted_images_${new Date().getTime()}.zip`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // 在组件顶部添加新的状态
    const [activeTab, setActiveTab] = useState('upload');
    const [imageUrls, setImageUrls] = useState('');
    // 添加处理网络图片的函数
    const handleAddUrls = async () => {
        const urls = imageUrls.split('\n').filter(url => url.trim());

        try {
            const newFiles = await Promise.all(
                urls.map(async (url) => {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new File([blob], url.split('/').pop(), { type: blob.type });
                })
            );

            setFiles(prev => [...prev, ...newFiles]);
            setImageUrls('');
        } catch (error) {
            alert('添加图片URL失败，请确保URL可访问且为图片格式');
        }
    };    

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2>批量图片格式转换</h2>

            {/* 添加Tab切换 */}
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => setActiveTab('upload')}
                    style={{
                        padding: '0.5rem 1rem',
                        marginRight: '1rem',
                        backgroundColor: activeTab === 'upload' ? '#2196f3' : '#fff',
                        color: activeTab === 'upload' ? '#fff' : '#000',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                >
                    本地图片
                </button>
                <button
                    onClick={() => setActiveTab('url')}
                    style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: activeTab === 'url' ? '#2196f3' : '#fff',
                        color: activeTab === 'url' ? '#fff' : '#000',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                >
                    网络图片
                </button>
            </div>

            {/* 本地上传区域 */}
            {activeTab === 'upload' && (
                <div className="upload-area">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${isDragging ? '#2196f3' : '#ccc'}`,
                            borderRadius: '8px',
                            padding: '3rem',
                            minHeight: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isDragging ? 'rgba(33,150,243,0.1)' : '#fafafa',
                            marginBottom: '1rem'
                        }}
                    >
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            multiple
                            style={{ display: 'none' }}
                            id="fileInput"
                        />
                        <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                                <div>点击或拖拽图片到此处上传</div>
                                <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                    支持 PNG、JPEG、WEBP 等格式
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            )}

            {/* 网络图片区域 */}
            {activeTab === 'url' && (
                <div className="url-input-area" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            placeholder="输入图片URL（支持多个URL，每行一个）"
                            value={imageUrls}
                            onChange={(e) => setImageUrls(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                            }}
                            multiple
                        />
                        <button
                            onClick={handleAddUrls}
                            disabled={!imageUrls.trim()}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#2196f3',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            添加
                        </button>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        提示：可以从其他网页拖拽图片到这里
                    </div>
                </div>
            )}

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragging ? '#2196f3' : '#ccc'}`,
                    borderRadius: '4px',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'rgba(33,150,243,0.1)' : '#fafafa',
                    marginBottom: '1rem',
                    cursor: 'pointer'
                }}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    multiple
                    style={{ display: 'none' }}
                    id="fileInput"
                />
                <label htmlFor="fileInput" style={{ cursor: 'pointer' }}>
                    点击或拖拽图片到此处上传
                </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label style={{ marginRight: '1rem' }}>
                    目标格式：
                    <select
                        value={targetFormat}
                        onChange={(e) => setTargetFormat(e.target.value)}
                        style={{ marginLeft: '0.5rem' }}
                    >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WEBP</option>
                    </select>
                </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <p>已选择 {files.length} 个文件</p>
                <button
                    onClick={handleConvertAll}
                    disabled={files.length === 0}
                    style={{ marginRight: '1rem' }}
                >
                    转换所有图片
                </button>
                <button
                    onClick={handleDownloadZip}
                    disabled={convertedBlobs.length === 0}
                >
                    下载转换后的文件
                </button>
            </div>

            {files.length > 0 && (
                <div style={{
                    maxHeight: '200px',
                    overflowY: 'auto',
                    border: '1px solid #eee',
                    padding: '1rem'
                }}>
                    {files.map((file, index) => (
                        <div key={index} style={{ marginBottom: '0.5rem' }}>
                            {file.name} ({Math.round(file.size / 1024)}KB)
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageConverter;