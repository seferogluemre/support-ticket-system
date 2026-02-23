import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { Ticket } from '../types';

// PDF StyleSheet
const pdfStyles = StyleSheet.create({
    page: { padding: 40, fontFamily: 'Helvetica' },
    header: { marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginBottom: 8 },
    subtitle: { fontSize: 12, color: '#64748b' },
    section: { marginVertical: 10 },
    label: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 12, color: '#334155', marginBottom: 12 },
    description: { fontSize: 12, color: '#334155', lineHeight: 1.5, marginTop: 8 },
});

export const TicketPDF = ({ ticket }: { ticket: Ticket }) => (
    <Document>
        <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.header}>
                <Text style={pdfStyles.title}>Ticket Özet Raporu</Text>
                <Text style={pdfStyles.subtitle}>Müşteri Destek Sistemi - {format(new Date(), 'dd.MM.yyyy HH:mm')}</Text>
            </View>
            <View style={pdfStyles.section}>
                <Text style={pdfStyles.label}>Ticket Başlığı</Text>
                <Text style={pdfStyles.value}>{ticket?.subject}</Text>
                <Text style={pdfStyles.label}>Referans No</Text>
                <Text style={pdfStyles.value}>#{ticket?.id}</Text>
            </View>
            <View style={pdfStyles.section}>
                <Text style={pdfStyles.label}>Müşteri Bilgileri</Text>
                <Text style={pdfStyles.value}>{ticket?.requesterName} ({ticket?.requesterEmail})</Text>
                <Text style={pdfStyles.label}>Durum / Öncelik</Text>
                <Text style={pdfStyles.value}>{ticket?.status} - {ticket?.priority}</Text>
            </View>
            <View style={pdfStyles.section}>
                <Text style={pdfStyles.label}>Sorun Açıklaması</Text>
                <Text style={pdfStyles.description}>{ticket?.description}</Text>
            </View>
        </Page>
    </Document>
);
