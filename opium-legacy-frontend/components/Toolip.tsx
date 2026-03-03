import { CSSProperties, FC, ReactNode } from "react";

interface Props {
  children: ReactNode;
  style?: CSSProperties;
  tooltip?: string;
}

const ToolTip: FC<Props> = ({ children, style, tooltip }): JSX.Element => {
  return (
    <div className="group relative inline-block">
      {children}
      {tooltip && (
        <div
          className="absolute bottom-full left-1/2 transform pointer-events-none -translate-x-1/2 flex justify-center"
        >
          <span
            style={style}
            className="opacity-0 group-hover:opacity-100 text-xs bg-black/80 translate-y-3 group-hover:translate-y-0 transition-all duration-300 p-1 rounded-lg whitespace-nowrap select-none"
          >
            {tooltip}
          </span>
        </div>
      )}
    </div>
  );
};

export default ToolTip;
