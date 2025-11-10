import React, { useRef } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Signature from "react-native-signature-canvas";

export default function SignaturePad({
  visible,
  title = "Signature",
  onOK,
  onCancel,
}) {
  const ref = useRef(null);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <View
            style={{
              height: 260,
              borderRadius: 8,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#ddd",
            }}
          >
            <Signature
              ref={ref}
              onOK={onOK}
              onEmpty={() => {}}
              descriptionText=""
              clearText="Clear"
              confirmText="Save"
              webStyle=".m-signature-pad--footer { display: none; }"
              autoClear={false}
            />
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => ref.current?.clear()}>
              <Text style={styles.btn}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => ref.current?.readSignature()}>
              <Text style={styles.btnPrimary}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.btn}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    padding: 16,
  },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  btn: { fontSize: 16, color: "#333", padding: 8 },
  btnPrimary: { fontSize: 16, color: "#0a84ff", fontWeight: "700", padding: 8 },
});
