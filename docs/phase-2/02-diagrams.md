# 2. Diagrams

This section includes UML and design diagrams aligned with the implemented system.

## 2.1 Use Case Diagram

```mermaid
flowchart LR
    Doctor([Doctor])
    Receptionist([Receptionist])
    Patient([Patient])

    UC1((Login))
    UC2((Manage Patients))
    UC3((Book Appointments))
    UC4((Record Diagnosis))
    UC5((Manage Inventory))
    UC6((Generate Reports))
    UC7((Manage Insurance))
    UC8((Manage Clinic Schedule))
    UC9((Create Invoice and Mark Paid))

    Doctor --> UC1
    Doctor --> UC4
    Doctor --> UC5
    Doctor --> UC6

    Receptionist --> UC1
    Receptionist --> UC2
    Receptionist --> UC3
    Receptionist --> UC5
    Receptionist --> UC6
    Receptionist --> UC7
    Receptionist --> UC8
    Receptionist --> UC9

    Patient --> UC2
    Patient --> UC3
    Patient --> UC9
```

## 2.2 Sequence Diagram - Login

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend App
    participant API as Django API
    participant DB as SQLite

    U->>FE: Enter email and password
    FE->>API: POST /api/login/
    API->>DB: Query Doctor by email
    alt Doctor not found
        API->>DB: Query Receptionist by email
    end
    DB-->>API: User row or empty
    alt Credentials valid
        API-->>FE: 200 + role + user profile
        FE-->>U: Open role dashboard
    else Invalid credentials
        API-->>FE: 401 + error
        FE-->>U: Show error message
    end
```

## 2.3 Sequence Diagram - Invoice with Insurance Rules

```mermaid
sequenceDiagram
    actor R as Receptionist
    participant FE as Frontend App
    participant API as InvoiceViewSet
    participant DB as Database

    R->>FE: Submit invoice items for patient
    FE->>API: POST /api/invoices/
    API->>DB: Load patient and insurance data
    API->>API: Check patient.is_insurance_active(today)
    alt Insurance active
        API->>API: Apply discount_percent as insurance_coverage
    else Insurance expired or missing
        API->>API: Set insurance_coverage = 0
    end
    API->>API: Compute subtotal, insurance_amount, total_amount
    API->>DB: Save invoice and invoice items
    API-->>FE: 201 + invoice payload
    FE-->>R: Display invoice with totals
```

## 2.4 Class Diagram (Domain Model)

```mermaid
classDiagram
    class Doctor {
      +doctor_id
      +name
      +specialty
      +email
      +password
    }

    class Receptionist {
      +receptionist_id
      +name
      +email
      +password
      +is_admin
    }

    class InsuranceCompany {
      +id
      +name
      +discount_percent
    }

    class Patient {
      +patient_id
      +name
      +age
      +gender
      +phone
      +has_insurance
      +insurance_valid_from
      +insurance_valid_to
      +is_insurance_active()
    }

    class Appointment {
      +appointment_id
      +date
      +time
      +status
      +type
    }

    class Service {
      +service_id
      +service_name
      +price
      +duration_minutes
    }

    class MedicalRecord {
      +record_id
      +diagnosis
      +notes
      +date
    }

    class Prescription {
      +prescription_id
      +notes
      +date
    }

    class Medication {
      +med_id
      +name
      +form
      +strength
    }

    class Invoice {
      +invoice_id
      +subtotal
      +insurance_coverage
      +insurance_amount
      +total_amount
      +payment_status
    }

    class InvoiceItem {
      +item_id
      +description
      +quantity
      +unit_price
      +amount
    }

    class InventoryItem {
      +item_id
      +name
      +category
      +quantity
      +expiry_date
      +is_low_stock
      +is_expiring_soon
    }

    class StockTransaction {
      +transaction_id
      +transaction_type
      +quantity
      +performed_by
    }

    InsuranceCompany "1" --> "0..*" Patient : covers
    Patient "1" --> "0..*" Appointment : books
    Doctor "1" --> "0..*" Appointment : attends
    Appointment "1" --> "0..1" Invoice : billed_as
    Invoice "1" --> "1..*" InvoiceItem : contains
    Patient "1" --> "0..*" MedicalRecord : has
    Doctor "0..1" --> "0..*" MedicalRecord : writes
    MedicalRecord "1" --> "0..*" Prescription : creates
    Prescription "1" --> "0..*" Medication : includes
    InventoryItem "1" --> "0..*" StockTransaction : logs
```

## 2.5 Component Diagram

```mermaid
flowchart TB
    subgraph Client
      A[Expo React Native App]
      B[Doctor Screens]
      C[Receptionist Screens]
    end

    subgraph API
      D[Django REST Layer]
      E[Business Logic in ViewSets]
      F[Serializers]
    end

    subgraph Data
      G[(SQLite Database)]
      H[Ontology External API]
    end

    A --> D
    B --> A
    C --> A
    D --> E
    E --> F
    E --> G
    E --> H
```

## 2.6 Deployment Diagram

```mermaid
flowchart LR
    Dev[Developer Machine]
    GH[GitHub Repository]
    CI[GitHub Actions CI]
    CD[GitHub Actions CD]
    FE[Frontend Hosting]
    BE[Backend Hosting]
    DB[(Production DB)]
    Users[Doctors and Receptionists]

    Dev --> GH
    GH --> CI
    CI --> CD
    CD --> FE
    CD --> BE
    BE --> DB
    Users --> FE
    FE --> BE
```

## 2.7 Activity Diagram - Appointment and Billing Flow

```mermaid
flowchart TD
    S([Start]) --> P[Register or Select Patient]
    P --> B[Book Appointment]
    B --> C[Doctor Consultation]
    C --> D[Save Diagnosis and Prescription]
    D --> I[Create Invoice]
    I --> Q{Insurance Active}
    Q -- Yes --> IA[Apply Insurance Coverage]
    Q -- No --> IB[No Insurance Discount]
    IA --> T[Calculate Final Total]
    IB --> T
    T --> M[Mark Payment Status]
    M --> Z([Finish])
```

## 2.8 State Diagram - Appointment Status

```mermaid
stateDiagram-v2
    [*] --> booked
    booked --> checked_in
    checked_in --> completed
    booked --> cancelled
    checked_in --> cancelled
```

