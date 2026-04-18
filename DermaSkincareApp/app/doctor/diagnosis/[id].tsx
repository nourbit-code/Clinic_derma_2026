import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


// --- REQUIRED EXTERNAL LIBRARIES ---
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Swipeable } from "react-native-gesture-handler";
import { useLocalSearchParams, useRouter } from 'expo-router';
import html2canvas from "html2canvas";

// --- AUTH CONTEXT ---
import { useAuth } from '../../context/AuthContext';

// --- API ---
import { getPatientDetails, getMedications, getMedicationSuggestions, saveDiagnosis, searchOntology } from '../../../src/api/doctorApi';
import { getInventory, consumeStock } from '../../../src/api/inventoryApi';

// --- EXTERNAL COMPONENTS (AS PER YOUR IMPORTS) ---
import PatientInfoBar, { ServiceKey } from '../../../components/PatientInfoBar';
import ReusablePhotoUploader from '../../../components/ReusablePhotoUploader';
import ServiceTabs from '../../../components/ServiceTabs';
import PrescriptionTable from "../../../components/PrescriptionTable";
import medSuggestMap from "../../data/med_suggest_map.json";


// ------------------- 1. DESIGN SYSTEM -------------------
const THEME = {
  primary: "#be185d", // Pink-700
  primaryLight: "#fce7f3",
  secondary: "#0f172a",
  accentBlue: "#0284c7",
  accentBlueLight: "#e0f2fe",
  text: "#334155",
  textLight: "#94a3b8",
  bg: "#f1f5f9",
  white: "#ffffff",
  border: "#e2e8f0",
  success: "#10b981",
  danger: "#ef4444",
  radius: 12,
  shadow: {
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
};



// ------------------- 2. DATA & UTILS -------------------
const DEFAULT_DIAGNOSIS_TEMPLATES = [
  "Acne Vulgaris", "Melasma", "Alopecia Areata", "Tinea Capitis", "Psoriasis", "Eczema", "Vitiligo"
];

const storageKeyForPatient = (patientId: string) => `patient_${patientId}_v6_data`;
const storageKeyForTemplates = "custom_diagnosis_templates_v1";

const MIN_MED_SEARCH_CHARS = 2;

interface PatientData {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone?: string;
  email?: string;
  lastVisit: string;
  allergies: string[];
  notes?: string;
  medicalHistory?: string[];
  surgeries?: string[];
  activeService: string;
}

// ⭐️ PhotoItem definition from ReusablePhotoUploader (needed for photos state)
interface PhotoItem {
    id: string;
    uri: string;
    tag: string;
    timestamp: string;
    caption: string;
}

// --- Section Header (Helper Component) ---
const SectionHeader = ({ icon, title, action, color = THEME.primary }: any) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.sectionTitle, { color: THEME.secondary }]}>{title}</Text>
    </View>
    {action && action}
  </View>
);

// ------------------- 3. CORE COMPONENTS (Defined before use) -------------------

// --- MEDICATION SELECTOR ---
const MedicationSelector = ({ medications, selectedMeds, setSelectedMeds, searchValue, onSearch, loading, error }: any) => {
  const [searchText, setSearchText] = useState(searchValue || "");
  const [medCategory, setMedCategory] = useState<string>("All");
  const [medSort, setMedSort] = useState<"AZ" | "ZA">("AZ");

  useEffect(() => {
    setSearchText(searchValue || "");
  }, [searchValue]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    onSearch?.(text);
  };

  const toggleMed = (med: any) => {
    if (selectedMeds.find((m: any) => m.id === med.id)) {
      setSelectedMeds(selectedMeds.filter((m: any) => m.id !== med.id));
    } else {
      setSelectedMeds([...selectedMeds, { ...med, notes: med.notes || "" }]);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    (medications || []).forEach((m: any) => {
      const raw = m?.category || m?.category_name || m?.group || m?.type;
      const name = (raw || "Other").toString().trim();
      if (name) set.add(name);
    });
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [medications]);

  const displayedMeds = useMemo(() => {
    let list = medications || [];
    if (medCategory !== "All") {
      list = list.filter((m: any) => {
        const raw = m?.category || m?.category_name || m?.group || m?.type || "Other";
        return raw?.toString?.().trim() === medCategory;
      });
    }
    list = [...list].sort((a: any, b: any) => {
      const aName = (a?.name || "").toString().toLowerCase();
      const bName = (b?.name || "").toString().toLowerCase();
      return medSort === "AZ" ? aName.localeCompare(bName) : bName.localeCompare(aName);
    });
    return list;
  }, [medCategory, medSort, medications]);

  return (
    <View style={styles.card}>
      <SectionHeader icon="search" title="Medication Database" />
      <View style={styles.medTopRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.medCategoryRow}
          contentContainerStyle={styles.medCategoryRowContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setMedCategory(cat)}
              style={[styles.medCategoryChip, medCategory === cat && styles.medCategoryChipActive]}
            >
              <Text style={[styles.medCategoryText, medCategory === cat && styles.medCategoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.medSortRow}>
          <TouchableOpacity
            onPress={() => setMedSort("AZ")}
            style={[styles.medSortChip, medSort === "AZ" && styles.medSortChipActive]}
          >
            <Ionicons name="arrow-down" size={12} color={medSort === "AZ" ? THEME.white : THEME.text} />
            <Text style={[styles.medSortText, medSort === "AZ" && styles.medSortTextActive]}>A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMedSort("ZA")}
            style={[styles.medSortChip, medSort === "ZA" && styles.medSortChipActive]}
          >
            <Ionicons name="arrow-up" size={12} color={medSort === "ZA" ? THEME.white : THEME.text} />
            <Text style={[styles.medSortText, medSort === "ZA" && styles.medSortTextActive]}>Z-A</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={THEME.textLight} style={{marginRight: 8}} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search meds (e.g. Panadol)..."
          placeholderTextColor={THEME.textLight}
          value={searchText}
          onChangeText={handleSearchChange}
        />
      </View>
      {loading && (
        <View style={styles.searchLoadingRow}>
          <ActivityIndicator size="small" color={THEME.primary} />
          <Text style={styles.searchLoadingText}>Searching...</Text>
        </View>
      )}
      {!!error && !loading && <Text style={styles.searchErrorText}>{error}</Text>}
      <ScrollView style={styles.medList} nestedScrollEnabled={true}>
        {displayedMeds.map((med: any) => {
          const isSelected = selectedMeds.find((m: any) => m.id === med.id);
          return (
            <TouchableOpacity
              key={med.id}
              style={[styles.medItem, isSelected && styles.medItemSelected]}
              onPress={() => toggleMed(med)}
            >
              <View>
                  <Text style={[styles.medName, isSelected && styles.medNameSelected]}>{med.name}</Text>
                  <Text style={[styles.medDose, isSelected && styles.medDoseSelected]}>{med.dose} • {med.duration}</Text>
              </View>
              <Ionicons name={isSelected ? "checkmark-circle" : "add-circle-outline"} size={22} color={isSelected ? THEME.primary : THEME.textLight} />
            </TouchableOpacity>
          );
        })}
        {!loading && medications.length === 0 && (
          <Text style={styles.emptyText}>
            {searchText.length < MIN_MED_SEARCH_CHARS
              ? `Type at least ${MIN_MED_SEARCH_CHARS} characters to search`
              : "No medications found."}
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

// --- CUSTOM MEDICATION ADDER ---
const CustomMedicationAdder = ({ setSelectedMeds }: any) => {
    const [name, setName] = useState("");
    const [dose, setDose] = useState("");
    const [duration, setDuration] = useState("");

    const addCustomMed = () => {
      if (!name || !dose || !duration) {
        Alert.alert("Missing Info", "Please fill in Name, Dosage, and Duration.");
        return;
      }
      
      const newMed = {
        id: Date.now(),
        name,
        dose,
        duration,
        notes: "Custom medication added by doctor."
      };

      setSelectedMeds((prev: any) => [newMed, ...prev]);
      setName("");
      setDose("");
      setDuration("");
    };

    return (
      <View style={[styles.card, { marginTop: 12 }]}>
          <SectionHeader icon="color-wand" title="Add Custom Medication" color={THEME.accentBlue} />
          <View style={styles.customInputRow}>
            <TextInput style={[styles.customInput, {flex: 2}]} placeholder="Medication Name" value={name} onChangeText={setName} />
            <TextInput style={styles.customInput} placeholder="Dose (e.g., 500mg)" value={dose} onChangeText={setDose} />
            <TextInput style={styles.customInput} placeholder="Duration" value={duration} onChangeText={setDuration} />
          </View>
          <TouchableOpacity onPress={addCustomMed} style={styles.addCustomBtn}>
            <Ionicons name="add-circle" size={18} color={THEME.white} />
            <Text style={styles.addCustomText}>Add to Prescription</Text>
          </TouchableOpacity>
      </View>
    );
};

// --- PRESCRIPTION TABLE (MODIFIED FOR PRESCRIPTION-ONLY PDF) ---
const PrescriptionTableAdvanced = ({ selectedMeds, setSelectedMeds, patient, doctorName, clinicName }: any) => {
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const printCardRef = useRef<HTMLDivElement>(null);
  const prescriptionIdRef = useRef("RX-" + Math.floor(100000 + Math.random() * 900000));

  const printablePrescriptions = useMemo(() => {
    return selectedMeds.map((med: any) => ({
      medication: med.name || "",
      dose: med.dose || "",
      duration: med.duration || "",
      notes: med.notes || "",
    }));
  }, [selectedMeds]);

  const toggleExpand = (id: number) => setExpandedMap((s) => ({ ...s, [id]: !s[id] }));
  const removeMed = (id: number) => setSelectedMeds((s: any[]) => s.filter((x) => x.id !== id));
  
  const updateMedField = (id: number, key: 'dose' | 'duration' | 'notes', value: string) => {
    setSelectedMeds((s: any[]) => s.map((m) => (m.id === id ? { ...m, [key]: value } : m)));
  };

  // Export prescription (web uses the same card as Patient Visit History)
  const exportToPDF = async () => {
    setExporting(true);

    try {
      if (Platform.OS === "web") {
        if (!printCardRef.current) {
          Alert.alert("Error", "Prescription view is not ready yet.");
          return;
        }
        const canvas = await html2canvas(printCardRef.current);
        const image = canvas.toDataURL("image/jpeg", 1.0);
        const link = document.createElement("a");
        link.href = image;
        link.download = `prescription-${prescriptionIdRef.current}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const rowsHtml = printablePrescriptions.map((m: any) => `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding:8px;">${m.medication || "-"}</td>
          <td style="padding:8px; text-align:center;">${m.dose || "-"}</td>
          <td style="padding:8px; text-align:center;">${m.duration || "-"}</td>
          <td style="padding:8px;">${m.notes || ""}</td>
        </tr>`).join("");

      const html = `
        <html>
        <body style="font-family: Helvetica, Arial, sans-serif; padding: 32px; color: #1e293b;">
          <div style="border:1px solid #ddd; border-radius:12px; padding:16px; position:relative;">
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #ccc; padding-bottom:6px; margin-bottom:12px;">
              <div>
                <div style="font-size:17px; font-weight:700; color:#9B084D;">${clinicName}</div>
                <div style="font-size:14px; color:#444;">${doctorName}</div>
              </div>
              <div style="text-align:right; font-size:12px; color:#666;">
                <div style="font-weight:700; color:#9B084D;">#${prescriptionIdRef.current}</div>
                <div>Date: ${new Date().toLocaleDateString()}</div>
              </div>
            </div>

            <div style="margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:8px;">
              <div><strong>Name:</strong> ${patient?.name || "-"}</div>
              <div><strong>Age:</strong> ${patient?.age || "-"}</div>
              <div><strong>Gender:</strong> ${patient?.gender || "-"}</div>
              <div><strong>Patient ID:</strong> ${patient?.id || "-"}</div>
            </div>

            <div style="position:absolute; top:40%; left:10%; font-size:40px; color:#9B084D20; transform:rotate(-20deg); z-index:-1;">
              ${clinicName}
            </div>

            <table style="width:100%; border-collapse:collapse; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
              <thead style="background:#9B084D; color:#fff;">
                <tr>
                  <th style="padding:8px; text-align:center;">Medication</th>
                  <th style="padding:8px; text-align:center;">Dose</th>
                  <th style="padding:8px; text-align:center;">Duration</th>
                  <th style="padding:8px; text-align:center;">Notes</th>
                </tr>
              </thead>
              <tbody>${rowsHtml || '<tr><td colspan="4" style="padding:8px; color:#94a3b8; font-style:italic;">No medications prescribed.</td></tr>'}</tbody>
            </table>

            <div style="margin-top:14px;">
              <div>Doctor's Signature: ${doctorName}</div>
              <div style="font-size:12px; color:#666; text-align:center; margin-top:8px;">Thank you for visiting ${clinicName}</div>
            </div>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Prescription Report' });
    } catch (err) { 
        console.error("PDF Export Error:", err);
        Alert.alert("Error", "PDF Generation failed. Check permissions or file data.");
    } 
    finally { setExporting(false); }
  };

  return (
    <View style={styles.card}>
      <View style={styles.tableHeaderRow}>
        <SectionHeader icon="clipboard" title={`Prescription (${selectedMeds.length})`} />
        <TouchableOpacity onPress={exportToPDF} style={styles.exportBtn} disabled={exporting}>
          {exporting ? <ActivityIndicator color="#fff" size="small"/> : <Ionicons name="print" size={16} color="#fff" />}
          <Text style={styles.exportText}>{exporting ? "Exporting..." : "Print PDF"}</Text>
        </TouchableOpacity>
      </View>

      {selectedMeds.length === 0 && <Text style={styles.emptyText}>No medications selected.</Text>}

      {selectedMeds.map((med: any) => (
        <Swipeable
          key={med.id}
          renderRightActions={() => (
            <TouchableOpacity style={styles.swipeDelete} onPress={() => removeMed(med.id)}>
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        >
          <View style={styles.tableRow}>
            <TouchableOpacity onPress={() => toggleExpand(med.id)} style={styles.rowMain}>
              <View>
                <Text style={styles.rowName}>{med.name}</Text>
                <Text style={styles.rowDetail}>{med.dose || 'N/A'} • {med.duration || 'N/A'}</Text>
              </View>
              <Ionicons name={expandedMap[med.id] ? "chevron-up" : "chevron-down"} size={16} color={THEME.textLight} />
            </TouchableOpacity>
            
            {expandedMap[med.id] && (
              <View style={styles.rowExpanded}>
                <View style={styles.editableFieldGroup}>
                    {/* EDITABLE FIELDS */}
                    <View style={styles.editableField}>
                        <Ionicons name="medkit" size={14} color={THEME.primary} />
                        <TextInput 
                            style={styles.editableInput} 
                            placeholder="Dosage" 
                            value={med.dose} 
                            onChangeText={(t) => updateMedField(med.id, 'dose', t)} 
                        />
                    </View>
                    <View style={styles.editableField}>
                        <Ionicons name="calendar" size={14} color={THEME.primary} />
                        <TextInput 
                            style={styles.editableInput} 
                            placeholder="Duration" 
                            value={med.duration} 
                            onChangeText={(t) => updateMedField(med.id, 'duration', t)} 
                        />
                    </View>
                </View>
                
                {/* Modernized Notes Box */}
                <View style={styles.notesBox}>
                    <View style={styles.notesHeader}>
                          <Ionicons name="document-text" size={14} color={THEME.secondary} />
                          <Text style={styles.notesTitle}>Specific Instructions</Text>
                    </View>
                    <TextInput 
                        style={styles.notesInput} 
                        placeholder="Add specific instructions for this drug..." 
                        value={med.notes} 
                        onChangeText={(t) => updateMedField(med.id, 'notes', t)} 
                        multiline
                    />
                </View>
              </View>
            )}
          </View>
        </Swipeable>
      ))}

      {Platform.OS === "web" && patient && (
        <View style={styles.printOnlyWrapper} pointerEvents="none">
          <PrescriptionTable
            prescriptions={printablePrescriptions}
            doctorName={doctorName || "Dr. Emily Carter"}
            clinicName={clinicName || "Derma Clinic"}
            patient={{
              name: patient.name,
              age: patient.age,
              gender: patient.gender,
              id: patient.id,
            }}
            prescriptionId={prescriptionIdRef.current}
            showDownloadButton={false}
            cardRef={printCardRef}
          />
        </View>
      )}
    </View>
  );
};


// --- DIAGNOSIS TEMPLATE MODAL (NEW) ---
const DiagnosisTemplateModal = ({ visible, onClose, onSelect, customTemplates, setCustomTemplates }: any) => {
    const [newTemplate, setNewTemplate] = useState("");

    const addTemplate = async () => {
        if (newTemplate.trim() && !customTemplates.includes(newTemplate.trim())) {
          const updated = [...customTemplates, newTemplate.trim()];
          setCustomTemplates(updated);
          await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(updated));
          setNewTemplate("");
        }
    };

    const removeTemplate = async (template: string) => {
        const updated = customTemplates.filter((t: string) => t !== template);
        setCustomTemplates(updated);
        await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(updated));
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Manage Diagnosis Templates</Text>
                    
                    <View style={styles.templateInputGroup}>
                        <TextInput
                            style={[styles.input, {flex: 1, height: 40, marginTop: 0}]}
                            placeholder="Type new common diagnosis..."
                            value={newTemplate}
                            onChangeText={setNewTemplate}
                        />
                        <TouchableOpacity onPress={addTemplate} style={styles.templateAddBtn}>
                            <Ionicons name="add" size={20} color={THEME.white} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{maxHeight: 200, marginTop: 15}}>
                        {customTemplates.map((template: string) => (
                            <View key={template} style={styles.templateListItem}>
                                <TouchableOpacity onPress={() => { onSelect(template); onClose(); }}>
                                    <Text style={styles.templateItemText}>{template}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => removeTemplate(template)}>
                                    <Ionicons name="close-circle-outline" size={20} color={THEME.danger} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                        <Text style={styles.modalCloseText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


// ------------------- 4. MAIN LOGIC -------------------

const DiagnosisPage = () => {
  // Get patient ID from route params
  const { id: patientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Get logged-in doctor from auth context
  const { user, isLoading: authLoading } = useAuth();
  const doctorDisplayName = useMemo(() => {
    const name = user?.name?.trim();
    if (!name) return "Dr. Emily Carter";
    return name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
  }, [user?.name]);
  const clinicDisplayName = "Derma Clinic";
  
  const [activeService, setActiveService] = useState<ServiceKey>('DIAGNOSIS');
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [rxNotes, setRxNotes] = useState(""); 
  const [selectedMeds, setSelectedMeds] = useState<any[]>([]);
  const [medSearchQuery, setMedSearchQuery] = useState("");
  const [medResults, setMedResults] = useState<any[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medError, setMedError] = useState<string | null>(null);
  // ⭐️ UPDATED: Retaining the PhotoItem type for photos state
  const [photos, setPhotos] = useState<PhotoItem[]>([]); 
  const [labs, setLabs] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Patient data from API
  const [patient, setPatient] = useState<PatientData | null>(null);
  
  // --- Laser session states ---
  const [laserNotes, setLaserNotes] = useState<string>("");
  const [passes, setPasses] = useState<number>(1);
  const [treatmentArea, setTreatmentArea] = useState<string>("");
  const [skinType, setSkinType] = useState<string>("");
  const [intensity, setIntensity] = useState<string>("Medium");
  
  // --- Inventory states for laser consumables ---
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [selectedConsumables, setSelectedConsumables] = useState<{itemId: number; name: string; quantity: number; available: number}[]>([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState<string>('All');
  
  // --- Post-treatment care instructions ---
  const [postCareInstructions, setPostCareInstructions] = useState<{id: string; text: string; icon: string; color: string; checked: boolean}[]>([
    { id: 'cold', text: 'Apply cold compress for 10-15 mins', icon: 'snow', color: '#0ea5e9', checked: true },
    { id: 'sun', text: 'Avoid direct sun exposure for 48 hours', icon: 'sunny', color: '#f59e0b', checked: true },
    { id: 'moisturize', text: 'Keep area moisturized', icon: 'water', color: '#3b82f6', checked: true },
    { id: 'exercise', text: 'Avoid strenuous exercise for 24 hours', icon: 'fitness', color: '#ef4444', checked: true },
    { id: 'heat', text: 'Avoid hot showers/saunas for 24 hours', icon: 'thermometer', color: '#8b5cf6', checked: true },
  ]);
  
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [customDiagnosisTemplates, setCustomDiagnosisTemplates] = useState<string[]>(DEFAULT_DIAGNOSIS_TEMPLATES);

  // --- Disease Ontology Search states (moved inside component) ---
  const [doQuery, setDoQuery] = useState("");
  const [doResults, setDoResults] = useState<any[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<{
    id: string;
    label: string;
    ontology?: string;
    code?: string;
  } | null>(null);
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe" | "">("");
  const [suggestedMeds, setSuggestedMeds] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const suggestionCacheRef = useRef<Map<string, any[]>>(new Map());
  const [doLoading, setDoLoading] = useState(false);
  const [doError, setDoError] = useState<string | null>(null);

  // --- Disease Ontology Search function ---
  const searchDiseaseOntology = async (text?: string) => {
    const query = text ?? "";
    setDoQuery(query);

    if (query.length < 2) {
      setDoResults([]);
      setDoError(null);
      return;
    }

    try {
      setDoLoading(true);
      setDoError(null);
      const result = await searchOntology({
        q: query,
        type: "disease",
        ontologies: "SNOMEDCT,ICD10CM,DOID",
        limit: 20,
      });

      if (result.success && Array.isArray(result.data)) {
        setDoResults(
          result.data.map((d: any) => ({
            id: d.id,
            label: d.name,
            ontology: d.ontology,
            code: d.code,
          }))
        );
      } else {
        setDoResults([]);
        setDoError(result.error || "Failed to fetch diseases");
      }
    } catch (err) {
      console.error("Ontology search failed", err);
      setDoError("Failed to fetch diseases");
    } finally {
      setDoLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    const fetchSuggestions = async () => {
      const rawLabel = selectedDisease?.label || diagnosis;
      // Always reset suggestions when diagnosis changes
      setSuggestedMeds([]);
      setSuggestError(null);
      if (!rawLabel || !rawLabel.trim()) {
        return;
      }
      setSuggestLoading(true);
      setSuggestError(null);

      const label = rawLabel.toLowerCase();
      const baseTerm = label.split(/[\\s,()]+/)[0]?.trim() || label;
      const termMap: Record<string, string[]> = (medSuggestMap as any) || {};

      const extraTerms = termMap[baseTerm] || [];
      const terms = Array.from(new Set([baseTerm, ...extraTerms].filter(Boolean)));

      // Cache: if we already have suggestions for this base term, return fast
      const cached = suggestionCacheRef.current.get(baseTerm);
      if (cached && cached.length > 0) {
        setSuggestedMeds(cached.slice(0, 10));
        setSuggestLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          terms.map((term) => getMedicationSuggestions({ q: term, limit: 8 }))
        );

        if (!isActive) return;
        const collected: any[] = [];
        results.forEach((res) => {
          if (res.success) {
            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            data.forEach((m: any) => collected.push(m));
          }
        });

        const seen = new Set<string>();
        const normalized = collected
          .map((m: any) => ({
            id: m.med_id ?? m.id,
            name: m.name || "",
            dose: m.strength || "",
            duration: "",
            notes: "",
          }))
          .filter((m: any) => {
            const key = `${m.id || ""}::${(m.name || "").toLowerCase()}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return m.name;
          });

        // Basic ranking: prioritize meds that include any mapped term in their name
        const rankTerms = new Set(extraTerms.map((t) => t.toLowerCase()));
        const ranked = normalized.sort((a: any, b: any) => {
          const aHit = [...rankTerms].some((t) => a.name.toLowerCase().includes(t)) ? 1 : 0;
          const bHit = [...rankTerms].some((t) => b.name.toLowerCase().includes(t)) ? 1 : 0;
          return bHit - aHit;
        });

        const top = ranked.slice(0, 10);
        suggestionCacheRef.current.set(baseTerm, top);
        setSuggestedMeds(top);
        if (normalized.length === 0) {
          setSuggestError("No suggestions found for this disease.");
        }
      } catch (err) {
        if (!isActive) return;
        console.error("Suggestion fetch failed", err);
        setSuggestedMeds([]);
        setSuggestError("Failed to fetch suggestions");
      } finally {
        setSuggestLoading(false);
      }
    };

    fetchSuggestions();
    return () => { isActive = false; };
  }, [selectedDisease?.label, diagnosis]);

  // --- Load Patient Data from Backend ---
  const loadPatientData = useCallback(async () => {
    if (!patientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch patient details from backend
      const result = await getPatientDetails(Number(patientId));
      
      if (result.success && result.data) {
        setPatient({
          id: result.data.id.toString(),
          name: result.data.name,
          age: result.data.age || 0,
          gender: result.data.gender || 'Unknown',
          phone: result.data.phone || '',
          email: result.data.email || '',
          lastVisit: result.data.last_visit || 'N/A',
          allergies: result.data.allergies || [],
          notes: result.data.notes || '',
          medicalHistory: result.data.medical_history || [],
          surgeries: result.data.surgeries || [],
          activeService: 'DIAGNOSIS'
        });
      } else {
        setError(result.error || 'Failed to load patient data');
      }
      
      // Also try to load locally cached session data (photos, labs, etc.)
      const raw = await AsyncStorage.getItem(storageKeyForPatient(patientId));
      if (raw) {
        const data = JSON.parse(raw);
        if(data.photos) setPhotos(data.photos);
        if(data.labs) setLabs(data.labs);
        // Don't overwrite diagnosis if we already have fresh data
        if(data.diagnosis && !diagnosis) setDiagnosis(data.diagnosis);
        if(data.rxNotes && !rxNotes) setRxNotes(data.rxNotes);
        if(data.selectedMeds && selectedMeds.length === 0) setSelectedMeds(data.selectedMeds);
      }
      
      // Load diagnosis templates
      const templateRaw = await AsyncStorage.getItem(storageKeyForTemplates);
      if (templateRaw) {
        setCustomDiagnosisTemplates(JSON.parse(templateRaw));
      } else {
        await AsyncStorage.setItem(storageKeyForTemplates, JSON.stringify(DEFAULT_DIAGNOSIS_TEMPLATES));
      }
    } catch (e) {
      console.error("Error loading data:", e);
      setError('Failed to load patient data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  // --- Medication Search (API) ---
  useEffect(() => {
    let isActive = true;
    const timer = setTimeout(async () => {
      const query = medSearchQuery.trim();
      if (query.length > 0 && query.length < MIN_MED_SEARCH_CHARS) {
        setMedResults([]);
        setMedError(null);
        return;
      }

      setMedLoading(true);
      setMedError(null);
      const result = await getMedications({ q: query || undefined, limit: 30 });
      if (!isActive) return;
      if (result.success) {
        const data = Array.isArray(result.data) ? result.data : (result.data?.results || []);
        setMedResults(
          data.map((m: any) => ({
            id: m.med_id ?? m.id,
            name: m.name || "",
            dose: m.strength || "",
            duration: "",
            notes: "",
          }))
        );
      } else {
        setMedResults([]);
        setMedError(result.error || "Failed to fetch medications");
      }
      setMedLoading(false);
    }, 300);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [medSearchQuery]);

  useEffect(() => {
    if (!authLoading && patientId) {
      loadPatientData();
    }
  }, [authLoading, patientId, loadPatientData]);

  // --- Load Inventory Items for Consumables ---
  const loadInventoryItems = useCallback(async () => {
    try {
      setInventoryLoading(true);
      const result = await getInventory();
      if (result.success && result.data) {
        // Filter to show only items with stock > 0
        const availableItems = result.data.filter((item: any) => item.quantity > 0);
        setInventoryItems(availableItems);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventoryItems();
  }, [loadInventoryItems]);

  // --- Clear all form fields for new diagnosis ---
  const clearFormFields = () => {
    setDiagnosis("");
    setDiagnosisSearch("");
    setRxNotes("");
    setSelectedMeds([]);
    setSeverity("");
    setPhotos([]);
    setLabs([]);
    setSelectedDisease(null);
    setDoQuery("");
    setDoResults([]);
    // Clear laser session fields
    setLaserNotes("");
    setPasses(1);
    setSelectedConsumables([]);
    setTreatmentArea("");
    setSkinType("");
    setIntensity("Medium");
  };

  // --- Save Data to Backend ---
  const saveData = async (startNew: boolean = false) => {
    if (!patientId || !user?.id) {
      Alert.alert("Error", "Missing patient or doctor information");
      return;
    }
    
    // Validate required fields
    if (!diagnosis.trim()) {
      Alert.alert("Missing Information", "Please enter a diagnosis before saving.");
      return;
    }
    
    const medsToSave = selectedMeds.filter((m) => (m.name || "").trim());
    if (medsToSave.length === 0) {
      Alert.alert("Missing Information", "Please add at least one medication to the prescription before saving.");
      return;
    }
    
    // Prevent duplicate saves (unless starting new)
    if (isSaved && !startNew) {
      Alert.alert(
        "Already Saved",
        "This diagnosis has already been saved. Use 'Save & New' to create a new diagnosis.",
        [{ text: "OK" }]
      );
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare photos and labs for backend
      const photosForBackend = photos.map(photo => ({
        uri: photo.uri,
        name: photo.id,
        tag: photo.tag || '',
        caption: photo.caption || ''
      }));
      
      const labsForBackend = labs.map(lab => ({
        uri: lab.uri,
        name: lab.name || '',
        mimeType: lab.mimeType || 'application/octet-stream'
      }));
      
      // Save to backend
      const diagnosisData = {
        doctor_id: user.id,
        diagnosis: diagnosis,
        notes: rxNotes,
        primary_disease_id: selectedDisease?.id || "",
        primary_disease_label: selectedDisease?.label || "",
        primary_disease_ontology: selectedDisease?.ontology || "",
        severity: severity,
        medications: medsToSave.map(med => ({
          name: med.name,
          dose: med.dose,
          duration: med.duration,
          notes: med.notes || ''
        })),
        photos: photosForBackend,
        labs: labsForBackend
      };
      
      const result = await saveDiagnosis(Number(patientId), diagnosisData);
      
      if (result.success) {
        // Also save photos/labs locally as backup
        const localData = {
          photos,
          labs,
          diagnosis,
          diagnosis_doid: selectedDisease?.id || null,
          rxNotes,
          selectedMeds,
          laserSession: {
            passes,
            treatmentArea,
            skinType,
            intensity,
            notes: laserNotes,
            consumables: selectedConsumables,
          }
        };
        await AsyncStorage.setItem(storageKeyForPatient(patientId), JSON.stringify(localData));
        
        // Always clear the form for a new diagnosis/session
        clearFormFields();
        // Clear local storage for this patient
        await AsyncStorage.removeItem(storageKeyForPatient(patientId));
        // Reset saved state
        setIsSaved(false);
        
        // Show confirmation notification
        Alert.alert("Success", "Diagnosis saved! Fields cleared for new session.");
      } else {
        Alert.alert("Error", result.error || "Failed to save diagnosis");
      }
    } catch (e) {
      console.error("Error saving data:", e);
      Alert.alert("Error", "Failed to save diagnosis. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // --- Pulse helpers for Laser session ---
  const incPasses = () => setPasses((p) => p + 1);
  const decPasses = () => setPasses((p) => Math.max(1, p - 1));
  
  // --- Save Laser Session ---
  const saveLaserSession = async () => {
    if (!patientId || !user) {
      Alert.alert("Error", "Patient or doctor information is missing");
      return;
    }
    
    if (!treatmentArea) {
      Alert.alert("Missing Information", "Please select or enter a treatment area.");
      return;
    }
    
    if (!skinType) {
      Alert.alert("Missing Information", "Please select the patient's skin type.");
      return;
    }
    
    setSaving(true);
    
    try {
      // Prepare photos for backend
      const photosForBackend = photos.map(photo => ({
        uri: photo.uri,
        name: photo.id,
        tag: photo.tag || 'Laser Session',
        caption: photo.caption || ''
      }));
      
      // Format consumables for display
      const consumablesText = selectedConsumables.length > 0
        ? selectedConsumables.map(c => `${c.quantity}x ${c.name}`).join(', ')
        : 'None';
      
      // Format post-care instructions
      const selectedPostCare = postCareInstructions.filter(i => i.checked).map(i => i.text);
      const postCareText = selectedPostCare.length > 0 
        ? selectedPostCare.join('\n• ') 
        : 'No specific instructions';
      
      // Save laser session as a medical record with type "Laser"
      const laserData = {
        doctor_id: user.id,
        diagnosis: `Laser Treatment - ${treatmentArea}`,
        notes: `Skin Type: ${skinType}\nIntensity: ${intensity}\nPasses: ${passes}\nConsumables: ${consumablesText}\n\nSession Notes:\n${laserNotes}\n\nPost-Treatment Care:\n• ${postCareText}`,
        medications: [], // Laser sessions typically don't have medications
        photos: photosForBackend,
        labs: [],
        service_type: 'Laser',
        laser_session: {
          treatment_area: treatmentArea,
          skin_type: skinType,
          intensity: intensity,
          passes: passes,
          consumables: selectedConsumables,
          notes: laserNotes,
          post_care: selectedPostCare
        }
      };
      
      const result = await saveDiagnosis(Number(patientId), laserData);
      
      if (result.success) {
        // Deduct inventory stock for each consumable used
        const stockDeductionErrors: string[] = [];
        for (const consumable of selectedConsumables) {
          const stockResult = await consumeStock(consumable.itemId, {
            quantity: consumable.quantity,
            notes: `Laser session for patient ${patient?.name || patientId} - ${treatmentArea}`,
            performed_by: user.name || 'Doctor'
          });
          
          if (!stockResult.success) {
            stockDeductionErrors.push(`${consumable.name}: ${stockResult.error}`);
          }
        }
        
        // Refresh inventory after deductions
        await loadInventoryItems();
        
        // Save locally as backup
        const localData = {
          photos,
          laserSession: {
            passes,
            treatmentArea,
            skinType,
            intensity,
            notes: laserNotes,
            consumables: selectedConsumables,
          }
        };
        await AsyncStorage.setItem(`laser_${patientId}_${Date.now()}`, JSON.stringify(localData));
        
        // Show success with any stock warnings
        const successMessage = stockDeductionErrors.length > 0
          ? `Laser session saved!\n\nNote: Some inventory updates failed:\n${stockDeductionErrors.join('\n')}`
          : "Laser session saved and inventory updated successfully!";
        
        // Automatically clear fields for new session
        setTreatmentArea("");
        setSkinType("");
        setIntensity("Medium");
        setPasses(1);
        setSelectedConsumables([]);
        setLaserNotes("");
        setPhotos([]);
        // Reset post-care instructions to all checked
        setPostCareInstructions(prev => prev.map(i => ({ ...i, checked: true })));
        
        // Show confirmation notification
        Alert.alert("Success", successMessage);
      } else {
        Alert.alert("Error", result.error || "Failed to save laser session");
      }
    } catch (e) {
      console.error("Error saving laser session:", e);
      Alert.alert("Error", "Failed to save laser session. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  // Helper to convert blob URL to base64 on web
  const blobToBase64 = async (blobUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      fetch(blobUrl)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  };

  // UPDATED: Use DocumentPicker to support PDF and Image files
  const pickLab = async () => {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true, 
    });

    if (r.canceled === false && r.assets && r.assets.length > 0) {
      const file = r.assets[0];
      const timestamp = new Date().toLocaleString('en-EG');
      
      let finalUri = file.uri;
      
      // Convert blob URL to base64 on web for persistence
      if (Platform.OS === 'web' && file.uri.startsWith('blob:')) {
        try {
          finalUri = await blobToBase64(file.uri);
        } catch (e) {
          console.error('Error converting blob to base64:', e);
        }
      }
      
      setLabs(prev => [
        ...prev, 
        { 
          id: Date.now().toString(), 
          uri: finalUri, 
          name: file.name, 
          mimeType: file.mimeType || 'application/octet-stream', 
          timestamp 
        }
      ]);
    }
  };
  const deleteLab = (id: string) => setLabs(l => l.filter(x => x.id !== id));
  
  // --- Diagnosis Templates Filtering ---
  const filteredTemplates = useMemo(() => {
    return customDiagnosisTemplates.filter(t => 
      t.toLowerCase().includes(diagnosisSearch.toLowerCase())
    );
  }, [customDiagnosisTemplates, diagnosisSearch]);

  const handleTemplateSelection = (template: string) => {
    setDiagnosis(prev => prev ? prev + ", " + template : template);
  };

  // --- Loading State ---
  if (authLoading || loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={THEME.primary} size="large" />
        <Text style={{ marginTop: 10, color: THEME.text }}>Loading patient data...</Text>
      </View>
    );
  }

  // --- Error State ---
  if (error || !patient) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="alert-circle-outline" size={48} color={THEME.danger} />
        <Text style={{ marginTop: 10, color: THEME.text, fontSize: 16, textAlign: 'center' }}>
          {error || 'Failed to load patient data'}
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 20, backgroundColor: THEME.primary, padding: 12, borderRadius: THEME.radius }}
          onPress={loadPatientData}
        >
          <Text style={{ color: THEME.white, fontWeight: '600' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  
  return (
    <View style={styles.container}>
      {/* 1. PATIENT INFO BAR (Using Imported Component) */}
 <PatientInfoBar 
  patient={patient} 
  onEdit={() => console.log("Edit patient")} 
  onHistoryClick={() => console.log("View history")}
  onPatientPageClick={() => router.push(`/doctor/patient-page/${patientId}`)}
  onReturnToHistoryClick={() => router.push('/doctor/patient-history')}
/>

<ServiceTabs
  activeService={activeService}
  setActiveService={setActiveService}
/>


      {/* 2. MAIN CONTENT (Wrapped in KeyboardAvoidingView) */}
      <KeyboardAvoidingView 
          style={styles.splitViewContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
      >
        
        {/* LEFT COLUMN: Clinical (SCROLLABLE) */}
        <ScrollView 
          style={styles.columnScroll} 
          contentContainerStyle={{paddingBottom: 40}}
          showsVerticalScrollIndicator={false}
        >
        {activeService === 'DIAGNOSIS' ? (
          <>
          {/* Diagnosis */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
                <SectionHeader icon="medical" title="Clinical Diagnosis" />
                <TouchableOpacity style={styles.manageBtn} onPress={() => setTemplateModalVisible(true)}>
                  <Ionicons name="options-outline" size={14} color={THEME.primary} />
                  <Text style={styles.manageBtnText}>Manage Templates</Text>
                </TouchableOpacity>
            </View>
            
            {/* Ontology Search (Moved Here) */}
            <View style={[styles.searchContainer, styles.clinicalSearch]}>
              <Ionicons name="search" size={18} color={THEME.textLight} style={{marginRight: 8}} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search standardized disease (optional)"
                placeholderTextColor={THEME.textLight}
                value={doQuery}
                onChangeText={searchDiseaseOntology}
              />
              {doLoading && <ActivityIndicator size="small" color={THEME.primary} />}
            </View>
            {!!doError && !doLoading && <Text style={styles.searchErrorText}>{doError}</Text>}

            {doResults.length > 0 && (
              <View style={styles.dropdown}>
                <ScrollView nestedScrollEnabled>
                  {doResults.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={styles.dropdownRow}
                      onPress={() => {
                        setSelectedDisease(d);
                        setDiagnosis((prev) =>
                          prev ? `${prev}, ${d.label}` : d.label
                        );
                        setDoResults([]);
                        setDoQuery("");
                      }}
                    >
                      <Text style={styles.dropdownTitle}>{d.label}</Text>
                      <Text style={styles.dropdownSub}>
                        {d.ontology ? `${d.ontology} • ` : ""}{d.code || d.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedDisease && (
              <View style={styles.selectedDiseaseCard}>
                <Text style={{ fontWeight: "700", color: THEME.secondary }}>
                  🧬 {selectedDisease.label}
                </Text>
                <Text style={{ fontSize: 12, color: THEME.textLight }}>
                  {selectedDisease.ontology ? `${selectedDisease.ontology} • ` : ""}{selectedDisease.code || selectedDisease.id}
                </Text>
              </View>
            )}

            {/* Filtered Templates */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templateRow}
              contentContainerStyle={styles.templateRowContent}
            >
              {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                  <TouchableOpacity key={t} style={styles.templateChip} onPress={() => handleTemplateSelection(t)}>
                    <Text style={styles.templateChipText}>+ {t}</Text>
                  </TouchableOpacity>
              )) : <Text style={[styles.emptyText, {textAlign: 'left'}]}>No matching templates found.</Text>}
            </ScrollView>
            
            {/* Main Diagnosis Input */}
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Type diagnosis..."
              value={diagnosis}
              onChangeText={setDiagnosis}
              multiline
            />
          </View>

          {/* Severity */}
          <View style={styles.card}>
            <SectionHeader icon="alert-circle" title="Severity" />
            <View style={styles.severityRow}>
              {["Mild", "Moderate", "Severe"].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.severityChip, severity === level && styles.severityChipActive]}
                  onPress={() => setSeverity(level as any)}
                >
                  <Text style={[styles.severityText, severity === level && styles.severityTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
              {severity && (
                <TouchableOpacity
                  style={styles.severityClear}
                  onPress={() => setSeverity("")}
                >
                  <Text style={styles.severityClearText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Suggested Medications */}
          <View style={styles.card}>
            <SectionHeader
              icon="bulb"
              title="Suggested Medications"
              action={
                suggestedMeds.length > 0 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{suggestedMeds.length}</Text>
                  </View>
                ) : null
              }
            />
            {suggestLoading && (
              <View style={styles.searchLoadingRow}>
                <ActivityIndicator size="small" color={THEME.primary} />
                <Text style={styles.searchLoadingText}>Loading suggestions...</Text>
              </View>
            )}
            {!!suggestError && !suggestLoading && <Text style={styles.searchErrorText}>{suggestError}</Text>}
            {!suggestLoading && suggestedMeds.length === 0 && (
              <Text style={styles.emptyText}>No suggestions yet. Select a disease or type a diagnosis.</Text>
            )}
            {suggestedMeds.length > 0 && (
              <View style={styles.chipRow}>
                {suggestedMeds.map((m: any) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.chip}
                    onPress={() => {
                      if (!selectedMeds.find((x: any) => x.id === m.id)) {
                        setSelectedMeds((prev: any[]) => [...prev, { ...m, notes: m.notes || "" }]);
                      }
                    }}
                  >
                    <Text style={styles.chipText}>{m.name}</Text>
                    <Ionicons name="add-circle-outline" size={14} color={THEME.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Prescription Notes */}
          <View style={styles.card}>
              <SectionHeader icon="create" title="Prescription / General Instructions" />
              <TextInput
                  style={[styles.input, styles.textarea, {height: 60}]}
                  placeholder="e.g., Avoid sun exposure, drink water, follow-up in 2 weeks..."
                  value={rxNotes}
                  onChangeText={setRxNotes}
                  multiline
              />
          </View>

          {/* Meds Search */}
          <MedicationSelector 
              medications={medResults} 
              selectedMeds={selectedMeds} 
              setSelectedMeds={setSelectedMeds} 
              searchValue={medSearchQuery}
              onSearch={setMedSearchQuery}
              loading={medLoading}
              error={medError}
          />
          
          {/* Custom Med Adder */}
          <CustomMedicationAdder setSelectedMeds={setSelectedMeds} />
          
          <PrescriptionTableAdvanced
              selectedMeds={selectedMeds}
              setSelectedMeds={setSelectedMeds}
              patient={patient}
              doctorName={doctorDisplayName}
              clinicName={clinicDisplayName}
          />
          
          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
            onPress={() => saveData(true)}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={THEME.white} size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color={THEME.white} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
          </>
        ) : activeService === 'LASER' ? (
          <>
          {/* ==================== LASER SESSION SECTION ==================== */}
          <View style={styles.card}>
            <SectionHeader icon="flash" title="Laser Treatment Session" color="#f59e0b" />
            
            {/* Treatment Area */}
            <View style={styles.laserFieldGroup}>
              <Text style={styles.laserLabel}>Treatment Area</Text>
              <View style={styles.laserChipRow}>
                {['Face', 'Neck', 'Arms', 'Legs', 'Back', 'Full Body', 'Underarms', 'Bikini'].map(area => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.laserChip,
                      treatmentArea === area && styles.laserChipSelected
                    ]}
                    onPress={() => setTreatmentArea(area)}
                  >
                    <Text style={[
                      styles.laserChipText,
                      treatmentArea === area && styles.laserChipTextSelected
                    ]}>{area}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Or specify custom area..."
                value={treatmentArea}
                onChangeText={setTreatmentArea}
              />
            </View>

            {/* Skin Type (Fitzpatrick Scale) */}
            <View style={styles.laserFieldGroup}>
              <Text style={styles.laserLabel}>Skin Type (Fitzpatrick Scale)</Text>
              <View style={styles.laserChipRow}>
                {[
                  { label: 'I', color: '#fef3c7', desc: 'Very Fair' },
                  { label: 'II', color: '#fde68a', desc: 'Fair' },
                  { label: 'III', color: '#fcd34d', desc: 'Medium' },
                  { label: 'IV', color: '#d97706', desc: 'Olive' },
                  { label: 'V', color: '#92400e', desc: 'Brown' },
                  { label: 'VI', color: '#451a03', desc: 'Dark' },
                ].map(type => (
                  <TouchableOpacity
                    key={type.label}
                    style={[
                      styles.skinTypeChip,
                      { backgroundColor: type.color },
                      skinType === type.label && styles.skinTypeChipSelected
                    ]}
                    onPress={() => setSkinType(type.label)}
                  >
                    <Text style={[
                      styles.skinTypeText,
                      type.label === 'V' || type.label === 'VI' ? { color: '#fff' } : { color: '#1f2937' },
                      skinType === type.label && { fontWeight: '800' }
                    ]}>
                      {type.label}
                    </Text>
                    <Text style={[
                      styles.skinTypeDesc,
                      type.label === 'V' || type.label === 'VI' ? { color: '#e5e7eb' } : { color: '#6b7280' }
                    ]}>
                      {type.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Laser Device & Settings */}
            <View style={styles.laserFieldGroup}>
              <Text style={styles.laserLabel}>Laser Intensity</Text>
              <View style={styles.laserChipRow}>
                {['Low', 'Medium', 'High', 'Very High'].map(level => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.intensityChip,
                      intensity === level && styles.intensityChipSelected,
                      level === 'Low' && { backgroundColor: '#d1fae5', borderColor: '#10b981' },
                      level === 'Medium' && { backgroundColor: '#fef3c7', borderColor: '#f59e0b' },
                      level === 'High' && { backgroundColor: '#fed7aa', borderColor: '#f97316' },
                      level === 'Very High' && { backgroundColor: '#fecaca', borderColor: '#ef4444' },
                    ]}
                    onPress={() => setIntensity(level)}
                  >
                    <Text style={[
                      styles.intensityText,
                      intensity === level && { fontWeight: '800' }
                    ]}>{level}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Number of Passes */}
            <View style={styles.laserFieldGroup}>
              <Text style={styles.laserLabel}>Number of Passes</Text>
              <View style={styles.passesContainer}>
                <TouchableOpacity 
                  style={styles.passesBtn}
                  onPress={decPasses}
                >
                  <Ionicons name="remove" size={20} color={THEME.white} />
                </TouchableOpacity>
                <View style={styles.passesDisplay}>
                  <Text style={styles.passesNumber}>{passes}</Text>
                  <Text style={styles.passesLabel}>passes</Text>
                </View>
                <TouchableOpacity 
                  style={styles.passesBtn}
                  onPress={incPasses}
                >
                  <Ionicons name="add" size={20} color={THEME.white} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Inventory Used */}
            <View style={styles.laserFieldGroup}>
              <Text style={styles.laserLabel}>Consumables/Inventory Used</Text>
              
              {/* Selected consumables display */}
              {selectedConsumables.length > 0 && (
                <View style={styles.selectedConsumablesContainer}>
                  {selectedConsumables.map((item, idx) => (
                    <View key={idx} style={styles.selectedConsumableItem}>
                      <View style={styles.selectedConsumableInfo}>
                        <Text style={styles.selectedConsumableName}>{item.name}</Text>
                        <Text style={styles.selectedConsumableQty}>Qty: {item.quantity}</Text>
                      </View>
                      <View style={styles.consumableQuantityControls}>
                        <TouchableOpacity
                          style={styles.consumableQtyBtn}
                          onPress={() => {
                            const updated = [...selectedConsumables];
                            if (updated[idx].quantity > 1) {
                              updated[idx].quantity -= 1;
                              setSelectedConsumables(updated);
                            }
                          }}
                        >
                          <Ionicons name="remove-circle" size={24} color={THEME.danger} />
                        </TouchableOpacity>
                        <Text style={styles.consumableQtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.consumableQtyBtn}
                          onPress={() => {
                            const updated = [...selectedConsumables];
                            if (updated[idx].quantity < updated[idx].available) {
                              updated[idx].quantity += 1;
                              setSelectedConsumables(updated);
                            } else {
                              Alert.alert("Warning", `Only ${updated[idx].available} units available in stock`);
                            }
                          }}
                        >
                          <Ionicons name="add-circle" size={24} color={THEME.success} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeConsumableBtn}
                          onPress={() => {
                            setSelectedConsumables(selectedConsumables.filter((_, i) => i !== idx));
                          }}
                        >
                          <Ionicons name="trash" size={20} color={THEME.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Add consumable button */}
              <TouchableOpacity
                style={styles.addConsumableBtn}
                onPress={() => setShowInventoryModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={THEME.primary} />
                <Text style={styles.addConsumableBtnText}>Add Consumable from Inventory</Text>
              </TouchableOpacity>
            </View>

            {/* Session Notes */}
            <View style={styles.laserFieldGroup}>
              <Text style={styles.laserLabel}>Session Notes</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Patient tolerance, reactions, recommendations..."
                value={laserNotes}
                onChangeText={setLaserNotes}
                multiline
              />
            </View>
          </View>

          {/* Post-Treatment Instructions Card */}
          <View style={styles.card}>
            <SectionHeader icon="bandage" title="Post-Treatment Care" color="#10b981" />
            <Text style={styles.postCareSubtitle}>Select instructions to include for this patient:</Text>
            <View style={styles.postCareContainer}>
              {postCareInstructions.map((instruction) => (
                <TouchableOpacity 
                  key={instruction.id}
                  style={[
                    styles.postCareItem,
                    instruction.checked && styles.postCareItemChecked
                  ]}
                  onPress={() => {
                    setPostCareInstructions(prev => 
                      prev.map(i => 
                        i.id === instruction.id ? { ...i, checked: !i.checked } : i
                      )
                    );
                  }}
                >
                  <View style={styles.postCareCheckbox}>
                    <Ionicons 
                      name={instruction.checked ? "checkbox" : "square-outline"} 
                      size={22} 
                      color={instruction.checked ? THEME.success : THEME.textLight} 
                    />
                  </View>
                  <Ionicons name={instruction.icon as any} size={20} color={instruction.color} />
                  <Text style={[
                    styles.postCareText,
                    !instruction.checked && styles.postCareTextUnchecked
                  ]}>{instruction.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.postCareSummary}>
              <Ionicons name="information-circle" size={16} color={THEME.textLight} />
              <Text style={styles.postCareSummaryText}>
                {postCareInstructions.filter(i => i.checked).length} of {postCareInstructions.length} instructions selected
              </Text>
            </View>
          </View>

          {/* Save Laser Session Button */}
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: '#f59e0b' }, saving && { opacity: 0.7 }]} 
            onPress={() => saveLaserSession()}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={THEME.white} size="small" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color={THEME.white} style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
          </>
        ) : null}
        </ScrollView>

        {/* RIGHT COLUMN: Media (SCROLLABLE) */}
        <ScrollView 
          style={[styles.columnScroll, { borderLeftWidth: 1, borderLeftColor: '#e2e8f0', paddingLeft: 16 }]} 
          contentContainerStyle={{paddingBottom: 40}}
          showsVerticalScrollIndicator={false}
        >
          
          {/* ⭐️ REPLACED PHOTO SECTION WITH REUSABLE COMPONENT */}
          <ReusablePhotoUploader
              photos={photos}
              setPhotos={setPhotos}
              patientId={patientId}
          />

          {/* LAB TESTS & SCANS SECTION (Updated to support PDF) */}
          <View style={[styles.card, { borderColor: THEME.accentBlueLight, borderWidth:1 }]}>
              <View style={styles.headerRow}>
                     <SectionHeader icon="cloud-upload" title={`Lab Tests & Scans (${labs.length})`} color={THEME.accentBlue} />
                     <TouchableOpacity onPress={pickLab} style={[styles.iconBtn, {backgroundColor: THEME.accentBlue}]}>
                        <Ionicons name="add" size={18} color={THEME.white} />
                     </TouchableOpacity>
              </View>
              
              <View style={styles.photoGrid}>
                    {labs.length === 0 && <View style={styles.emptyState}><Text style={styles.emptyText}>No labs/scans uploaded. (Supports Images/PDFs)</Text></View>}
                    {labs.map((l) => {
                        const isImage = l.mimeType && l.mimeType.startsWith('image/');
                        return (
                            <View key={l.id} style={[styles.photoCard, { borderColor: THEME.accentBlueLight }]}>
                                <TouchableOpacity 
                                    onPress={() => { 
                                        Alert.alert("View File", `Attempting to open ${l.name}. Viewer is currently simplified.`);
                                    }}
                                >
                                    {isImage ? (
                                        <Image 
                                            source={{ uri: l.uri }} 
                                            style={[styles.photoImg, {opacity: 0.8}]} // Reduced opacity for Labs 
                                        />
                                    ) : (
                                        <View style={styles.pdfPlaceholder}>
                                            <Ionicons name="document-text" size={40} color={THEME.accentBlue} />
                                            <Text style={styles.pdfText} numberOfLines={2}>{l.name}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.deleteMini} onPress={() => deleteLab(l.id)}>
                                    <Ionicons name="close" size={10} color="#fff" />
                                </TouchableOpacity>
                                <View style={styles.photoFooter}>
                                    <Text style={styles.timestampText}>{l.timestamp}</Text>
                                </View>
                            </View>
                        );
                    })}
              </View>
          </View>
        </ScrollView>
        
        {/* Modals */}
        <DiagnosisTemplateModal
            visible={templateModalVisible}
            onClose={() => setTemplateModalVisible(false)}
            onSelect={handleTemplateSelection}
            customTemplates={customDiagnosisTemplates}
            setCustomTemplates={setCustomDiagnosisTemplates}
        />
        
        {/* Inventory Selection Modal */}
        <Modal
          visible={showInventoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInventoryModal(false)}
        >
          <View style={styles.inventoryModalOverlay}>
            <View style={styles.inventoryModalContent}>
              <View style={styles.inventoryModalHeader}>
                <Text style={styles.inventoryModalTitle}>Select Consumable</Text>
                <TouchableOpacity onPress={() => setShowInventoryModal(false)}>
                  <Ionicons name="close" size={24} color={THEME.text} />
                </TouchableOpacity>
              </View>
              
              {inventoryLoading ? (
                <View style={styles.inventoryLoadingContainer}>
                  <ActivityIndicator size="large" color={THEME.primary} />
                  <Text style={styles.inventoryLoadingText}>Loading inventory...</Text>
                </View>
              ) : inventoryItems.length === 0 ? (
                <View style={styles.inventoryEmptyContainer}>
                  <Ionicons name="cube-outline" size={48} color={THEME.textLight} />
                  <Text style={styles.inventoryEmptyText}>No items in inventory</Text>
                  <TouchableOpacity 
                    style={styles.refreshInventoryBtn}
                    onPress={loadInventoryItems}
                  >
                    <Ionicons name="refresh" size={18} color={THEME.white} />
                    <Text style={styles.refreshInventoryBtnText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Search Bar */}
                  <View style={styles.inventorySearchContainer}>
                    <Ionicons name="search" size={20} color={THEME.textLight} />
                    <TextInput
                      style={styles.inventorySearchInput}
                      placeholder="Search items..."
                      value={inventorySearch}
                      onChangeText={setInventorySearch}
                      placeholderTextColor={THEME.textLight}
                    />
                    {inventorySearch.length > 0 && (
                      <TouchableOpacity onPress={() => setInventorySearch('')}>
                        <Ionicons name="close-circle" size={20} color={THEME.textLight} />
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {/* Category Filter */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.inventoryCategoryScroll}
                    contentContainerStyle={styles.inventoryCategoryContainer}
                  >
                    {['All', ...Array.from(new Set(inventoryItems.map(i => i.category || 'Uncategorized')))].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.inventoryCategoryChip,
                          inventoryCategory === cat && styles.inventoryCategoryChipActive
                        ]}
                        onPress={() => setInventoryCategory(cat)}
                      >
                        <Text style={[
                          styles.inventoryCategoryChipText,
                          inventoryCategory === cat && styles.inventoryCategoryChipTextActive
                        ]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {/* Inventory List */}
                  <ScrollView style={styles.inventoryList}>
                    {inventoryItems
                      .filter(item => {
                        const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
                        const matchesCategory = inventoryCategory === 'All' || (item.category || 'Uncategorized') === inventoryCategory;
                        return matchesSearch && matchesCategory;
                      })
                      .map((item) => {
                        const isAlreadySelected = selectedConsumables.some(c => c.itemId === item.item_id);
                        return (
                          <TouchableOpacity
                            key={item.item_id}
                            style={[
                              styles.inventoryItem,
                              isAlreadySelected && styles.inventoryItemSelected
                            ]}
                            onPress={() => {
                              if (isAlreadySelected) {
                                // Remove if already selected
                                setSelectedConsumables(prev => prev.filter(c => c.itemId !== item.item_id));
                              } else {
                                // Add new item
                                setSelectedConsumables(prev => [
                                  ...prev,
                                  {
                                    itemId: item.item_id,
                                    name: item.name,
                                    quantity: 1,
                                    available: item.quantity
                                  }
                                ]);
                              }
                            }}
                          >
                            <View style={styles.inventoryItemCheckbox}>
                              <Ionicons 
                                name={isAlreadySelected ? "checkbox" : "square-outline"} 
                                size={24} 
                                color={isAlreadySelected ? THEME.success : THEME.textLight} 
                              />
                            </View>
                            <View style={styles.inventoryItemInfo}>
                              <Text style={styles.inventoryItemName}>{item.name}</Text>
                              <Text style={styles.inventoryItemCategory}>{item.category || 'Uncategorized'}</Text>
                            </View>
                            <View style={styles.inventoryItemStock}>
                              <Text style={[
                                styles.inventoryItemQty,
                                item.quantity <= 5 && styles.inventoryLowStock
                              ]}>
                                {item.quantity} {item.unit || 'units'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    {inventoryItems.filter(item => {
                      const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase());
                      const matchesCategory = inventoryCategory === 'All' || (item.category || 'Uncategorized') === inventoryCategory;
                      return matchesSearch && matchesCategory;
                    }).length === 0 && (
                      <View style={styles.inventoryNoResults}>
                        <Ionicons name="search-outline" size={32} color={THEME.textLight} />
                        <Text style={styles.inventoryNoResultsText}>No items found</Text>
                      </View>
                    )}
                  </ScrollView>
                  
                  {/* Done Button */}
                  <View style={styles.inventoryModalFooter}>
                    <Text style={styles.inventorySelectedCount}>
                      {selectedConsumables.length} item{selectedConsumables.length !== 1 ? 's' : ''} selected
                    </Text>
                    <TouchableOpacity 
                      style={styles.inventoryDoneBtn}
                      onPress={() => {
                        setShowInventoryModal(false);
                        setInventorySearch('');
                        setInventoryCategory('All');
                      }}
                    >
                      <Text style={styles.inventoryDoneBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};


// ------------------- 5. STYLES -------------------
const styles = StyleSheet.create({
  container: {
      flex: 1,
      backgroundColor: THEME.bg,
  },
  splitViewContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0, // Removed padding from top as PatientInfoBar is outside
  },
  columnScroll: {
    flex: 1,
    paddingRight: 16,
  },
  card: {
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    padding: 16,
    marginBottom: 16,
    ...THEME.shadow,
  },
  printOnlyWrapper: {
    position: "absolute",
    left: -20000,
    top: -20000,
  },

  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.secondary,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius / 2,
  },
  manageBtnText: {
    fontSize: 12,
    color: THEME.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Input/Search Styles
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    padding: 10,
    fontSize: 14,
    color: THEME.text,
    marginTop: 12,
    backgroundColor: THEME.white,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    paddingHorizontal: 10,
    height: 40,
    marginTop: 12,
  },
  clinicalSearch: {
    marginTop: 6,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: THEME.text,
  },
  medTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  medCategoryRow: {
    flex: 1,
  },
  medCategoryRowContent: {
    paddingRight: 6,
  },
  medCategoryChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
    marginRight: 8,
  },
  medCategoryChipActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
  },
  medCategoryText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: "600",
  },
  medCategoryTextActive: {
    color: THEME.primary,
  },
  medSortRow: {
    flexDirection: "row",
    gap: 6,
  },
  medSortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
  },
  medSortChipActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primary,
  },
  medSortText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: "600",
  },
  medSortTextActive: {
    color: THEME.white,
  },

  // Template Chip Styles
  templateChip: {
    backgroundColor: THEME.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 8,
  },
  templateChipText: {
    color: THEME.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Medication List Styles
  medList: {
    maxHeight: 200, 
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    backgroundColor: THEME.white,
  },
  searchLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  searchLoadingText: {
    fontSize: 12,
    color: THEME.textLight,
  },
  searchErrorText: {
    fontSize: 12,
    color: THEME.danger,
    marginTop: 6,
  },
  medItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.white,
  },
  medItemSelected: {
    backgroundColor: THEME.primaryLight,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.secondary,
  },
  medNameSelected: {
    color: THEME.primary,
  },
  medDose: {
    fontSize: 12,
    color: THEME.textLight,
  },
  medDoseSelected: {
    color: THEME.text,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    marginTop: 6,
    backgroundColor: THEME.white,
    maxHeight: 180,
  },
  dropdownRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  dropdownTitle: {
    fontWeight: "700",
    color: THEME.secondary,
  },
  dropdownSub: {
    fontSize: 11,
    color: THEME.textLight,
  },
  selectedDiseaseCard: {
    marginTop: 6,
    marginBottom: 8,
    padding: 10,
    borderRadius: THEME.radius,
    backgroundColor: THEME.primaryLight,
    borderLeftWidth: 4,
    borderLeftColor: THEME.primary,
  },
  templateRow: {
    marginTop: 4,
    marginBottom: 10,
  },
  templateRowContent: {
    paddingRight: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: THEME.primaryLight,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  chipText: {
    fontSize: 12,
    color: THEME.primary,
    fontWeight: "600",
  },
  severityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  severityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
  },
  severityChipActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primaryLight,
  },
  severityText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: "600",
  },
  severityTextActive: {
    color: THEME.primary,
  },
  severityClear: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.white,
  },
  severityClearText: {
    fontSize: 12,
    color: THEME.textLight,
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: THEME.white,
    fontSize: 12,
    fontWeight: "700",
  },

  // Custom Med Adder Styles
  customInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    padding: 10,
    fontSize: 14,
    backgroundColor: THEME.white,
  },
  addCustomBtn: {
    backgroundColor: THEME.accentBlue,
    borderRadius: THEME.radius,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addCustomText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 14,
  },
  
  // Prescription Table Styles
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exportBtn: {
    backgroundColor: THEME.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius / 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportText: {
    color: THEME.white,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyText: {
    color: THEME.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  tableRow: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    marginBottom: 8,
    backgroundColor: THEME.white,
    overflow: 'hidden',
  },
  rowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', // Initially transparent
  },
  rowName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.secondary,
  },
  rowDetail: {
    fontSize: 12,
    color: THEME.textLight,
    marginTop: 2,
  },
  rowExpanded: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.bg, // Subtle background for expanded area
  },
  swipeDelete: {
    backgroundColor: THEME.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: '100%',
    borderRadius: THEME.radius,
    marginLeft: 8,
  },
  editableFieldGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  editableField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: THEME.radius,
    paddingHorizontal: 8,
    backgroundColor: THEME.white,
    height: 40,
  },
  editableInput: {
    flex: 1,
    fontSize: 13,
    color: THEME.text,
    paddingLeft: 8,
  },
  notesBox: {
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.primaryLight,
    borderRadius: THEME.radius,
    padding: 10,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.secondary,
  },
  notesInput: {
    fontSize: 13,
    color: THEME.text,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: THEME.primary,
    padding: 15,
    borderRadius: THEME.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  saveBtnText: {
    color: THEME.white,
    fontWeight: '700',
    fontSize: 16,
  },

  // Photo & Lab Styles
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  photoCard: {
    width: '47%', // Adjusted for gap
    aspectRatio: 1,
    borderRadius: THEME.radius,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: THEME.border,
    backgroundColor: THEME.bg,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 5,
  },
  timestampText: {
    color: THEME.white,
    fontSize: 10,
  },
  deleteMini: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: THEME.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptyState: {
    width: '100%',
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: THEME.textLight,
    borderRadius: THEME.radius,
    marginTop: 10,
  },
  iconBtn: {
    padding: 8,
    borderRadius: THEME.radius,
    marginLeft: 10,
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  pdfText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.accentBlue,
    marginTop: 5,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: THEME.white,
    borderRadius: THEME.radius,
    padding: 20,
    ...THEME.shadow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.secondary,
    marginBottom: 15,
  },
  templateInputGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  templateAddBtn: {
    backgroundColor: THEME.primary,
    padding: 10,
    borderRadius: THEME.radius,
  },
  templateListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  templateItemText: {
    fontSize: 14,
    color: THEME.text,
  },
  modalCloseBtn: {
    backgroundColor: THEME.secondary,
    padding: 12,
    borderRadius: THEME.radius,
    marginTop: 20,
    alignItems: 'center',
  },
  modalCloseText: {
    color: THEME.white,
    fontWeight: '700',
  },

  // Service Tabs (used by PatientInfoBarComponent if it handles them)
  tabContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: THEME.bg,
  },
  tabActive: {
    backgroundColor: THEME.primary,
  },
  tabText: {
    color: THEME.text,
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: THEME.white,
  },

  // ==================== LASER SECTION STYLES ====================
  laserFieldGroup: {
    marginBottom: 20,
  },
  laserLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.secondary,
    marginBottom: 10,
  },
  laserChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  laserChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: THEME.bg,
    borderWidth: 1.5,
    borderColor: THEME.border,
  },
  laserChipSelected: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  laserChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },
  laserChipTextSelected: {
    color: '#b45309',
    fontWeight: '700',
  },
  
  // Skin Type Chips
  skinTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    minWidth: 55,
  },
  skinTypeChipSelected: {
    borderColor: THEME.primary,
    transform: [{ scale: 1.05 }],
  },
  skinTypeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  skinTypeDesc: {
    fontSize: 9,
    marginTop: 2,
  },
  
  // Intensity Chips
  intensityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  intensityChipSelected: {
    transform: [{ scale: 1.05 }],
  },
  intensityText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.secondary,
  },
  
  // Passes Counter
  passesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  passesBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadow,
  },
  passesDisplay: {
    alignItems: 'center',
    minWidth: 80,
  },
  passesNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#f59e0b',
  },
  passesLabel: {
    fontSize: 12,
    color: THEME.textLight,
    fontWeight: '600',
  },
  
  // Post-Care Section
  postCareContainer: {
    gap: 8,
  },
  postCareSubtitle: {
    fontSize: 13,
    color: THEME.textLight,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  postCareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: THEME.bg,
    padding: 12,
    borderRadius: THEME.radius,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  postCareItemChecked: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  postCareCheckbox: {
    marginRight: 2,
  },
  postCareText: {
    fontSize: 13,
    color: THEME.text,
    flex: 1,
  },
  postCareTextUnchecked: {
    color: THEME.textLight,
    textDecorationLine: 'line-through',
  },
  postCareSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  postCareSummaryText: {
    fontSize: 12,
    color: THEME.textLight,
  },
  
  // Inventory Consumables Styles
  selectedConsumablesContainer: {
    gap: 8,
    marginBottom: 12,
  },
  selectedConsumableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: THEME.radius,
    padding: 12,
  },
  selectedConsumableInfo: {
    flex: 1,
  },
  selectedConsumableName: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.text,
  },
  selectedConsumableQty: {
    fontSize: 12,
    color: THEME.textLight,
    marginTop: 2,
  },
  consumableQuantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  consumableQtyBtn: {
    padding: 4,
  },
  consumableQtyText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
    minWidth: 24,
    textAlign: 'center',
  },
  removeConsumableBtn: {
    padding: 4,
    marginLeft: 8,
  },
  addConsumableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: THEME.primary,
    borderRadius: THEME.radius,
    backgroundColor: THEME.primaryLight,
  },
  addConsumableBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.primary,
  },
  
  // Inventory Modal Styles
  inventoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  inventoryModalContent: {
    backgroundColor: THEME.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    minHeight: 400,
  },
  inventoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  inventoryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
  },
  inventoryLoadingContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  inventoryLoadingText: {
    fontSize: 14,
    color: THEME.textLight,
  },
  inventoryEmptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  inventoryEmptyText: {
    fontSize: 14,
    color: THEME.textLight,
  },
  refreshInventoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius,
    marginTop: 8,
  },
  refreshInventoryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.white,
  },
  inventoryList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  inventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: THEME.bg,
    borderRadius: THEME.radius,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  inventoryItemSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  inventoryItemDisabled: {
    opacity: 0.5,
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  inventoryItemCheckbox: {
    marginRight: 12,
  },
  inventoryItemInfo: {
    flex: 1,
  },
  inventoryItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.text,
  },
  inventoryItemCategory: {
    fontSize: 12,
    color: THEME.textLight,
    marginTop: 2,
  },
  inventoryItemStock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inventoryItemQty: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.success,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inventoryLowStock: {
    color: THEME.danger,
    backgroundColor: '#fef2f2',
  },
  
  // Inventory Search & Filter Styles
  inventorySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    borderRadius: THEME.radius,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  inventorySearchInput: {
    flex: 1,
    fontSize: 15,
    color: THEME.text,
  },
  inventoryCategoryScroll: {
    maxHeight: 44,
    marginVertical: 8,
  },
  inventoryCategoryContainer: {
    paddingHorizontal: 12,
    gap: 8,
  },
  inventoryCategoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: THEME.bg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  inventoryCategoryChipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  inventoryCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.text,
  },
  inventoryCategoryChipTextActive: {
    color: THEME.white,
  },
  inventoryNoResults: {
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  inventoryNoResultsText: {
    fontSize: 14,
    color: THEME.textLight,
  },
  inventoryModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    backgroundColor: THEME.white,
  },
  inventorySelectedCount: {
    fontSize: 14,
    color: THEME.textLight,
  },
  inventoryDoneBtn: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: THEME.radius,
  },
  inventoryDoneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.white,
  },
});


export default DiagnosisPage;
