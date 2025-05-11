import { Resend } from "resend";
import axios from "axios";
import User from "../models/userModel";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtp = async (email: string, phone: string) => {
    try {
        const emailOtp = Math.floor(1000 + Math.random() * 9000);
        const phoneOtp = Math.floor(1000 + Math.random() * 9000);
        await User.findOneAndUpdate(
            { email, phone },
            { emailOtp, phoneOtp }
        );
        const { error } = await resend.emails.send({
            from: 'Cut The Queue <support@cuttheq.in>',
            to: email,
            subject: 'OTP for verification',
            text: `Your OTP is ${emailOtp}`,
        });
        if (error) {
            throw error;
        }
        
        const url = `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${phone}/${phoneOtp}`;
        const response = await axios.get(url);
        if (response.status === 200) {
            console.log(`Successfully sent SMS to ${phone}`);
        } else {
            throw new Error('Failed to send SMS');
        }
        return { emailOtp, phoneOtp };
    } catch (error) {
        console.log(error);
        return { emailOtp: null, phoneOtp: null };
    }
}

export { sendOtp };