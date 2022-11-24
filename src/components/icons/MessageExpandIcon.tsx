import { Icon, IconProps } from './Icon';

export const MessageExpandOffIcon = (props: IconProps) => (
	<Icon {...props}>
		<svg width='15' height='15' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path
				d='M4.99999 3.78132L8.29999 0.481323L9.24266 1.42399L4.99999 5.66666L0.757324 1.42399L1.69999 0.481323L4.99999 3.78132Z'
				fill='#B0B0B0'
			/>
		</svg>
	</Icon>
);

export const MessageExpandOnIcon = (props: IconProps) => (
	<Icon {...props}>
		<svg width='15' height='15' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'>
			<path
				d='M4.99999 2.21868L1.69999 5.51868L0.757324 4.57601L4.99999 0.333344L9.24266 4.57601L8.29999 5.51868L4.99999 2.21868Z'
				fill='#4E8AFF'
			/>
		</svg>
	</Icon>
);
