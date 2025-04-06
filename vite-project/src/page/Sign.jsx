import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SignContract = ({ contractId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [signedFile, setSignedFile] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [connection, setConnection] = useState(null); // Lưu trữ kết nối SignalR
  const [hubProxy, setHubProxy] = useState(null); // Lưu trữ hub proxy

  const writeToLog = (message) => {
    setLogs((prevLogs) => [...prevLogs, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  useEffect(() => {
    if (typeof $ === 'undefined') {
      setError('jQuery không được tải');
      writeToLog('jQuery không được tải');
      return;
    }
    if (typeof $.signalR === 'undefined') {
      setError('SignalR không được tải');
      writeToLog('SignalR không được tải');
      return;
    }

    $.getScript('http://localhost:8080/signalr/hubs', function () {
      const conn = $.hubConnection('http://localhost:8080/signalr');
      const proxy = conn.createHubProxy('simpleHub');

      proxy.on('ReceiveSignedFile', (fileName, fileBase64) => {
        setSignedFile({ fileName, fileBase64 });
        writeToLog(`File đã ký: ${fileName}`);
        uploadSignedFile(fileName, fileBase64);
      });

      proxy.on('ShowError', (err) => {
        setError(err);
        setIsUploading(false); // Đặt lại trạng thái khi có lỗi
        writeToLog(`Lỗi: ${err}`);
      });

      conn.start()
        .done(() => {
          console.log('Đã kết nối với SignalR');
          writeToLog('Đã kết nối tới server SignalR');
          setConnection(conn); // Lưu kết nối
          setHubProxy(proxy); // Lưu proxy
        })
        .fail((err) => {
          setError('Kết nối SignalR thất bại: ' + err);
          writeToLog('Kết nối SignalR thất bại: ' + err);
        });

      return () => {
        conn.stop();
      };
    }).fail(() => {
      setError('Không thể tải /signalr/hubs');
      writeToLog('Không thể tải /signalr/hubs');
    });
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      writeToLog(`Đã chọn file: ${file.name}`);
    } else {
      setError('Vui lòng chọn file PDF');
      writeToLog('Lỗi: Vui lòng chọn file PDF');
      setSelectedFile(null);
    }
  };

  const handleSign = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file PDF trước khi ký');
      writeToLog('Lỗi: Vui lòng chọn file PDF trước khi ký');
      return;
    }

    if (!connection || !hubProxy) {
      setError('Chưa kết nối tới SignalR');
      writeToLog('Lỗi: Chưa kết nối tới SignalR');
      return;
    }

    setIsUploading(true);
    writeToLog('Đang ký, vui lòng chờ...');
    try {
      const fileBase64 = await convertFileToBase64(selectedFile);
      const signInfo = {
        llx: 100,
        lly: 100,
        urx: 300,
        ury: 200,
        FileType: 'PDF',
        FileName: selectedFile.name // Gửi thêm tên file gốc
      };
      const page = 1;

      hubProxy.invoke('SignDocument', fileBase64, signInfo, page);
    } catch (err) {
      setError('Lỗi xử lý file: ' + err.message);
      writeToLog('Lỗi xử lý file: ' + err.message);
      setIsUploading(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadSignedFile = async (fileName, fileBase64) => {
    try {
      const response = await axios.post('http://localhost:8088/api/v1/contracts/sign', {
        contractId: 1,
        fileName: fileName,
        fileBase64: fileBase64,
        signedBy: 'Director',
        signedAt: new Date().toISOString(),
      });
      console.log('File uploaded successfully:', response.data);
      writeToLog('File đã được lưu vào database thành công');
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Lỗi khi upload file đã ký');
      writeToLog('Lỗi khi upload file đã ký: ' + (err.response?.data || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <div>
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
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !selectedFile || isUploading ? 'not-allowed' : 'pointer',
          }}
        >
          {isUploading ? 'Đang xử lý...' : 'Ký hợp đồng'}
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>}
      {selectedFile && !signedFile && <p>File đã chọn: {selectedFile.name}</p>}
      {signedFile && <p>File đã ký: {signedFile.fileName}</p>}
      <div>
        <fieldset style={{ width: '400px' }}>
          <legend>Log</legend>
          <textarea
            value={logs.join('\n')}
            readOnly
            cols="50"
            rows="5"
            style={{ resize: 'vertical', fontSize: '12px' }}
          />
        </fieldset>
      </div>
    </div>
  );
};

export default SignContract;