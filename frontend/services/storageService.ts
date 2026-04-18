import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIAnalysisResult } from './aiService'; // Import interface đã tạo ở bài trước

const STORAGE_KEY = '@my_saved_recipes';

// Luu 1 mon an moi
export const saveRecipe = async (newRecipe: AIAnalysisResult) => {
    try {
        // 1. Mở sổ ra xem có món nào chưa
        const existingData = await AsyncStorage.getItem(STORAGE_KEY);
        let recipesArray = existingData ? JSON.parse(existingData) : [];

        // 2. Thêm ngày giờ lưu để phân biệt
        const recipeWithId = {
            ...newRecipe,
            id: Date.now().toString(), // // Tạo ID ngẫu nhiên bằng thời gian
            saveAt: new Date().toLocaleDateString('vi-VN')
        };

        // 3. Nhét món mới vào ĐẦU danh sách
        recipesArray.unshift(recipeWithId);

        // 4. Cất sổ lại
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipesArray));
        return true;
    } catch (error) {
        console.log("Lỗi khi lưu món ăn:", error);
        return false;
    }
};

// Lấy toàn bộ danh sách đã lưu ra để hiển thị
export const getSavedRecipes = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.log("Lỗi khi lấy danh sách món ăn:", error);
        return [];
    }
};

// xoá một món ăn dựa trên ID
export const deleteRecipe = async (id: string) => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
            let recipesArray = JSON.parse(data);
            // Lọc bỏ món có id trùng với id truyền vào
            recipesArray = recipesArray.filter((item: any) => item.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(recipesArray));
            return true;
        }
        return false;
    } catch (error) {
        console.log("Lỗi khi xoá món ăn:", error);
        return false;
    }
};