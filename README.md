# Ứng dụng đặt lịch chăm sóc/ khám cho thú cưng

## Cài đặt backend
```
cd backend
npm install
```

Chạy migration trên Sequelize
```
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npx sequelize-cli db:migrate:status
```

Khởi tạo server (chạy tại port 3000)
```
npm run dev
```

## Cài đặt frontend
```
cd frontend/pet-care/
npm install
```

Khởi tạo app (chạy tại localhost:8081 hoặc 192.168.0.103:8081)
```
npx expo start
```
