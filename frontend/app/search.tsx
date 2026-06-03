import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, Pressable, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";

export default function SearchPage() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.safeArea}>
			<StatusBar barStyle="dark-content" backgroundColor="#f6f3ea" />
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.backButton}>
					<MaterialIcons name="arrow-back" size={24} color="#111" />
				</Pressable>
				<Text style={styles.title}>Tìm kiếm</Text>
			</View>

			<View style={styles.body}>
				<Text style={styles.placeholder}>Trang tìm kiếm đang sẵn sàng.</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#f6f3ea",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#e8e2d8",
	},
	backButton: {
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		marginLeft: 8,
		fontSize: 20,
		fontWeight: "800",
		color: "#111",
	},
	body: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	placeholder: {
		fontSize: 16,
		color: "#555",
		textAlign: "center",
	},
});

