import { Niramit } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";

const niramit = Niramit({
  weight: ["300", "400", "500", "700"],
  subsets: ["thai", "latin"],
});

export const metadata = {
  title: "ระบบวิเคราะห์เทรนแมลงโรงงาน | Insect Trend Analyzer",
  description: "ระบบบันทึก วิเคราะห์ และจัดทำรายงานแนวโน้มแมลงสะสมในพื้นที่โรงงานตามมาตรฐาน GMP/HACCP ขับเคลื่อนด้วย AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className={`${niramit.className} min-h-full flex flex-col`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}

