import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createInsuranceCompany, getInsuranceCompanies, updateInsuranceCompany } from "../src/api/receptionistApi";

const PRIMARY_DARK = "#9B084D";
const PRIMARY_LIGHT = "#E80A7A";
const INPUT_BORDER = "#DDD";
const SECONDARY_BG = "#FFE4EC";

type InsuranceCompany = {
  id: number;
  name: string;
  discount_percent: number;
};

export default function InsuranceSettingsContent({ embedded = false }: { embedded?: boolean }) {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [name, setName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const result = await getInsuranceCompanies();
      if (result.success && result.data) {
        setCompanies(result.data);
      }
    } catch (error) {
      console.error("[Insurance] Error fetching companies:", error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCompanies().finally(() => setLoading(false));
  }, [fetchCompanies]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCompanies().finally(() => setRefreshing(false));
  }, [fetchCompanies]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Fields", "Please enter a company name.");
      return;
    }

    const discountValue = parseFloat(discountPercent) || 0;
    setSubmitting(true);

    try {
      if (editingCompany) {
        const result = await updateInsuranceCompany(editingCompany.id, {
          name: name.trim(),
          discount_percent: discountValue,
        });
        if (result.success) {
          Alert.alert("Updated", "Insurance company updated successfully.");
          setEditingCompany(null);
          setName("");
          setDiscountPercent("");
          fetchCompanies();
        } else {
          Alert.alert("Error", result.error || "Failed to update company.");
        }
      } else {
        const result = await createInsuranceCompany({
          name: name.trim(),
          discount_percent: discountValue,
        });
        if (result.success) {
          Alert.alert("Added", "Insurance company added successfully.");
          setName("");
          setDiscountPercent("");
          fetchCompanies();
        } else {
          Alert.alert("Error", result.error || "Failed to add company.");
        }
      }
    } catch (error) {
      console.error("[Insurance] Error saving company:", error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company);
    setName(company.name);
    setDiscountPercent(company.discount_percent?.toString() || "0");
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
    setName("");
    setDiscountPercent("");
  };

  const content = (
    <View style={styles.container}>
      <Text style={styles.title}>Insurance Settings</Text>

      {editingCompany && (
        <View style={styles.editingBanner}>
          <Ionicons name="pencil-outline" size={20} color={PRIMARY_DARK} style={{ marginRight: 8 }} />
          <Text style={styles.editingText}>Editing: {editingCompany.name}</Text>
          <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelEditButton}>
            <Ionicons name="close-circle" size={24} color={PRIMARY_DARK} />
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="Insurance Company Name"
        value={name}
        onChangeText={setName}
        editable={!submitting}
      />
      <TextInput
        style={styles.input}
        placeholder="Discount Percent (e.g., 20)"
        value={discountPercent}
        onChangeText={setDiscountPercent}
        keyboardType="numeric"
        editable={!submitting}
      />

      <TouchableOpacity
        style={[styles.saveButton, submitting && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>{editingCompany ? "Save Changes" : "Add Company"}</Text>
        )}
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_DARK} />
          <Text style={styles.loadingText}>Loading companies...</Text>
        </View>
      ) : companies.length > 0 ? (
        <View style={styles.list}>
          <Text style={styles.listTitle}>Companies</Text>
          {companies.map((company) => (
            <View key={company.id} style={styles.companyCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{company.name}</Text>
                <Text style={styles.companyInfo}>{company.discount_percent}% discount</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(company)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No insurance companies added yet</Text>
        </View>
      )}
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[PRIMARY_DARK]}
          tintColor={PRIMARY_DARK}
        />
      }
    >
      {content}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#F9F9F9",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: PRIMARY_DARK,
    textAlign: "center",
    marginBottom: 25,
  },
  editingBanner: {
    backgroundColor: SECONDARY_BG,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_DARK,
    flexDirection: "row",
    alignItems: "center",
  },
  editingText: {
    color: PRIMARY_DARK,
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
  },
  cancelEditButton: {
    padding: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: INPUT_BORDER,
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: PRIMARY_DARK,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  list: {
    marginTop: 30,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: PRIMARY_DARK,
    marginBottom: 10,
  },
  companyCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    alignItems: "center",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  companyInfo: {
    color: "#666",
    marginTop: 3,
  },
  editButton: {
    backgroundColor: PRIMARY_LIGHT,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    color: "#999",
    fontSize: 16,
  },
});
