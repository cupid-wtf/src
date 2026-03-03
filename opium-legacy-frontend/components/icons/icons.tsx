import React from 'react';

interface IconProps {
	width?: number;
	height?: number;
	className?: string;
	style?: React.CSSProperties;
  }

  export const Owner: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  width={width}
	  height={height}
	  viewBox="0 0 24 24"
	  className={className}
	  style={style}
	  fill="#FFD700"
	>
	  <path d="M11.219 3.375 8 7.399 4.781 3.375A1.002 1.002 0 0 0 3 4v15c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V4a1.002 1.002 0 0 0-1.781-.625L16 7.399l-3.219-4.024c-.381-.474-1.181-.474-1.562 0zM5 19v-2h14.001v2H5zm10.219-9.375c.381.475 1.182.475 1.563 0L19 6.851 19.001 15H5V6.851l2.219 2.774c.381.475 1.182.475 1.563 0L12 5.601l3.219 4.024z"></path>
	</svg>
)
  export const Verified: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style}) => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  width={width}
	  height={height}
	  viewBox="0 0 24 24"
	  className={className}
	  style={style}
	  fill="#1d9bf0" 
	>
		<path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"></path>
	</svg>
  )
  export const Premium: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style}) => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  width={width}
	  height={height}
	  viewBox="0 0 24 24"
	  className={className}
	  style={style}
	  fill="#1d9bf0" 
	  stroke='currentColor'
	  strokeWidth={2}
	  strokeLinecap='round'
	  strokeLinejoin='round'
	>
	<path fill="none" d="M6 5h12l3 5l-8.5 9.5a.7 .7 0 0 1 -1 0l-8.5 -9.5l3 -5" /><path d="M10 12l-2 -2.2l.6 -1" />
	</svg>
  )
  export const BugHunter: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => (
	<svg 
	xmlns="http://www.w3.org/2000/svg" 
	height={height}
	width={width} 
	className={className}
	style={style}
	viewBox="0 0 24 24" 
	fill="white" 
	stroke="currentColor" 
	strokeWidth="2" 
	strokeLinecap="round" strokeLinejoin="round"
	 >
		<path d="m8 2 1.88 1.88"/>
		<path d="M14.12 3.88 16 2"/>
		<path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/>
		<path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/>
		<path d="M12 20v-9"/>
		<path d="M6.53 9C4.6 8.8 3 7.1 3 5"/>
		<path d="M6 13H2"/>
		<path d="M3 21c0-2.1 1.7-3.9 3.8-4"/>
		<path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/>
		<path d="M22 13h-4"/>
		<path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
	</svg>
  )
  export const ServerBooster: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  width={width}
	  height={height}
	  style={style}
	  viewBox="0 0 24 24"
	  className={className}
	  fill="#FF73FA" 
	>
	  <path d="M11.3598 1.23178C11.7307 0.92274 12.2693 0.92274 12.6402 1.23178L18.6402 6.23178C18.8682 6.42177 19 6.70322 19 7V17C19 17.2968 18.8682 17.5782 18.6402 17.7682L12.6402 22.7682C12.2693 23.0773 11.7307 23.0773 11.3598 22.7682L5.35982 17.7682C5.13182 17.5782 5 17.2968 5 17V7C5 6.70322 5.13182 6.42177 5.35982 6.23178L11.3598 1.23178ZM12.6757 5.26285C12.2934 4.91238 11.7066 4.91238 11.3243 5.26285L8.32428 8.01285C8.11765 8.20226 8 8.46969 8 8.75V15.25C8 15.5303 8.11765 15.7977 8.32428 15.9872L11.3243 18.7372C11.7066 19.0876 12.2934 19.0876 12.6757 18.7372L15.6757 15.9872C15.8824 15.7977 16 15.5303 16 15.25V8.75C16 8.46969 15.8824 8.20226 15.6757 8.01285L12.6757 5.26285ZM10 14.8101V9.1899L12 7.35657L14 9.1899V14.8101L12 16.6434L10 14.8101Z" />
	</svg>
  );

  export const Developer: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  width={width}
	  height={height}
	  viewBox="0 0 24 24"
	  className={className}
	  style={style}
	  fill="#00FF7F" 
	>
	  <path d="M1.293,11.293l4-4A1,1,0,1,1,6.707,8.707L3.414,12l3.293,3.293a1,1,0,1,1-1.414,1.414l-4-4A1,1,0,0,1,1.293,11.293Zm17.414-4a1,1,0,1,0-1.414,1.414L20.586,12l-3.293,3.293a1,1,0,1,0,1.414,1.414l4-4a1,1,0,0,0,0-1.414ZM13.039,4.726l-4,14a1,1,0,0,0,.686,1.236A1.053,1.053,0,0,0,10,20a1,1,0,0,0,.961-.726l4-14a1,1,0,1,0-1.922-.548Z" />
	</svg>
  )
  export const Calamity: React.FC<IconProps> = ({ width = 24, height = 24, className = '', style }) => (
	<svg
	  xmlns="http://www.w3.org/2000/svg"
	  width={width}
	  height={height}
	  viewBox="0 0 512 512"
	  className={className}
	  style={style}
	  fill="#A290E1" 
	>
	  <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" stroke="none">
		<path d="M2537 4159 c-8 -13 -234 -378 -501 -811 l-485 -787 502 -820 c276
		  -451 502 -819 503 -818 1 1 227 367 502 814 l501 812 -491 803 c-270 442 -496
		  809 -503 817 -11 11 -16 9 -28 -10z m352 -1087 l320 -523 -322 -521 c-177
		  -287 -326 -522 -331 -522 -5 -1 -154 236 -332 527 l-323 527 316 513 c173 281
		  320 518 326 525 6 7 14 9 18 5 5 -5 153 -244 328 -531z"/>
	  </g>
	</svg>
  );