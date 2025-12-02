export interface Visitor {
    expectedTimeIn: any;
    id: string;
    name: string;
    surname: string;
    company: string;
    visitorPhoneNumber: string;
    photo: string;
    reasonForVisit: string;
    host: string;
    date: string;
    timeIn: string;
    timeOut?: string;
    agreementSigned: boolean;
}
