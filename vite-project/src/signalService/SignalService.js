// import * as signalR from '@microsoft/signalr';

// // Factory function tạo SignalR service
// const createSignalRService = () => {
//   // Khởi tạo connection
//   const connection = new signalR.HubConnectionBuilder()
//     .withUrl('http://localhost:8080/signalr')
//     .configureLogging(signalR.LogLevel.Information)
//     .withAutomaticReconnect()
//     .build();

//   connection.onclose((error) => {
//     console.log('Disconnected from SignalR hub', error);
//   });

//   // Khởi tạo kết nối
//   const startConnection = async () => {
//     if (connection.state === signalR.HubConnectionState.Disconnected) {
//       try {
//         await connection.start();
//         console.log('Connected to SignalR hub');
//         return true;
//       } catch (err) {
//         console.error('Error connecting to SignalR:', err);
//         throw err;
//       }
//     }
//     return true;
//   };

//   // Gửi yêu cầu ký tài liệu
//   const signDocument = async (fileBase64, signInfo, page) => {
//     try {
//       if (connection.state !== signalR.HubConnectionState.Connected) {
//         await startConnection();
//       }
//       await connection.invoke('SignDocument', fileBase64, signInfo, page);
//       console.log('Sign request sent successfully');
//     } catch (err) {
//       console.error('Error signing document:', err);
//       throw err;
//     }
//   };

//   // Đăng ký nhận file đã ký
//   const onReceiveSignedFile = (callback) => {
//     connection.on('ReceiveSignedFile', (fileName, fileBase64) => {
//       console.log('Received signed file:', fileName);
//       callback(fileName, fileBase64);
//     });
//   };

//   // Đăng ký nhận lỗi
//   const onError = (callback) => {
//     connection.on('ShowError', (error) => {
//       console.error('SignalR error:', error);
//       callback(error);
//     });
//   };

//   // Hủy đăng ký sự kiện
//   const offReceiveSignedFile = () => {
//     connection.off('ReceiveSignedFile');
//   };

//   const offError = () => {
//     connection.off('ShowError');
//   };

//   // Ngắt kết nối
//   const stopConnection = async () => {
//     try {
//       await connection.stop();
//       console.log('SignalR connection stopped');
//     } catch (err) {
//       console.error('Error stopping connection:', err);
//     }
//   };

//   // Trả về các phương thức
//   return {
//     startConnection,
//     signDocument,
//     onReceiveSignedFile,
//     onError,
//     offReceiveSignedFile,
//     offError,
//     stopConnection
//   };
// };

// // Export instance duy nhất
// export default createSignalRService;