import React from 'react';
import ImageConverter from './converters/image/ImageConverter';

function App() {
    return (
        <div>
            <h1 style={{ textAlign: 'center' }}>图片格式转换器</h1>
            <ImageConverter />
        </div>
    );
}

export default App;