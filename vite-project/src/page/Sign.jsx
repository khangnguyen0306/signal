import React, { useEffect, useState } from 'react';
import axios from 'axios';
import createSignalRService from '../signalService/SignalService'; // Đảm bảo đường dẫn đúng

const signalRService = createSignalRService();

const SignContract = ({ contractId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Khởi tạo kết nối SignalR
    signalRService.startConnection().catch((err) => {
      setError('Không thể kết nối đến SignalR: ' + err.message);
    });

    // Đăng ký nhận file đã ký
    signalRService.onReceiveSignedFile((fileName, fileBase64) => {
      setSignedFile({ fileName, fileBase64 });
      uploadSignedFile(fileName, fileBase64);
    });

    // Đăng ký xử lý lỗi
    signalRService.onError((err) => setError(err));

    // Cleanup khi component unmount
    return () => {
      signalRService.offReceiveSignedFile();
      signalRService.offError();
    };
  }, []);

  // Xử lý khi người dùng chọn file
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Vui lòng chọn file PDF');
      setSelectedFile(null);
    }
  };

  // Xử lý ký tài liệu
  const handleSign = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file PDF trước khi ký');
      return;
    }

    setIsUploading(true);
    try {
      const fileBase64 = await convertFileToBase64(selectedFile);
      
      const signInfo = {
        llx: 100,
        lly: 100,
        urx: 300,
        ury: 200,
        FileType: 'PDF'
      };
      const page = 1;

      await signalRService.signDocument(fileBase64, signInfo, page); // Sửa thành signalRService
    } catch (err) {
      setError('Lỗi khi xử lý file: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm chuyển file thành base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload file đã ký lên server
  const uploadSignedFile = async (fileName, fileBase64) => {
    try {
      await axios.post('/api/contracts/sign', {
        contractId,
        fileName,
        fileBase64,
        signedBy: 'Director',
        signedAt: new Date().toISOString()
      });
      console.log('File uploaded successfully');
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Lỗi khi upload file đã ký');
    }
  };

  return (
    <div >
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ marginRight: '10px' }}
      />
      <button
        onClick={handleSign}
        disabled={!selectedFile || isUploading}
        style={{
          backgroundColor: 'red',
          color: 'white',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer'
        }}
      >
        {isUploading ? 'Đang xử lý...' : 'Ký hợp đồng'}
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>Lỗi: {error}</p>}
      {selectedFile && !signedFile && (
        <p style={{ marginTop: '10px' }}>File đã chọn: {selectedFile.name}</p>
      )}
      {signedFile && (
        <p style={{ marginTop: '10px' }}>File đã ký: {signedFile.fileName}</p>
      )}
    </div>
  );
};

export default SignContract;