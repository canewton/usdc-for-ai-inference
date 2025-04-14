import { QRCodeSVG } from "qrcode.react";
import type { FunctionComponent } from "react";

interface Props {
  walletId: string;
}

export const WalletQRCode: FunctionComponent<Props> = ({ walletId }) => {
  return (
    <div className="flex justify-center">
      <QRCodeSVG value={walletId} size={256} level="H" className="p-4" />
    </div>
  );
};
