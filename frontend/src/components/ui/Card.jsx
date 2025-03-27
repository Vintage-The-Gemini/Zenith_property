import React from "react";

const Card = ({ children, className = "", onClick, ...rest }) => {
  return (
    <div
      className={`bg-white rounded-lg shadow ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
