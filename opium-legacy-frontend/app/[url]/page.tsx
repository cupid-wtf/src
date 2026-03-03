import { Metadata } from 'next';
import dbConnect from "@/lib/db";
import UserModel, { User } from "@/lib/models/user"; 
import UserProfileClient from "@/components/ProfileComp";
import { LinkButton } from '@/components/button';

type UserProfile = Pick<User, 
  | 'url'
  | 'username'
  | 'uid'
  | 'box_color'
  | 'bg_color'
  | 'background_blur'
  | 'border_color'
  | 'border_width'
  | 'effects'
  | 'text_color'
  | 'admin'
  | 'avatar'
  | 'socials'
  | 'banner'
  | 'bio'
  | 'autoplayfix'  
  | 'autoplaymessage'
  | 'discord'
  | 'background'
  | 'opacity'
  | 'font'
  | 'blur'
  | 'border_style'
  | 'user_layout'
  | 'verified'
  | 'user_badges'
  | 'width'
  | 'custom_badges'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
> & { _id: any };


type UserMetadata = Pick<User, 'username' | 'bio' | 'avatar' | 'banner' | 'bg_color'>;

export async function generateMetadata(props: { params: Promise<{ url: string }> }): Promise<Metadata> {
    const params = await props.params; 
    await dbConnect();
    
    const user = await UserModel.findOne({ url: params.url })  
        .select<UserMetadata>('username bio avatar box_color')
        .lean<UserMetadata>()
        .exec();
    
    if (!user) {
        return {
            title: 'User Not Found',
            description: 'The user you are looking for does not exist.',
            openGraph: {
                title: 'User Not Found',
                description: 'The user you are looking for does not exist.',
            },
            twitter: {
                card: 'summary_large_image',
                title: 'User Not Found',
                description: 'The user you are looking for does not exist.',
            }
        };
    }
    
    const title = `${user.username}`;
    const description = user.bio || '';
    
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'profile',
            images: [`${user.avatar}`]
        },
        themeColor: user.bg_color, 
    };
}


export default async function UserProfile(props: { params: Promise<{ url: string }> }) {
    const params = await props.params; 
    await dbConnect();
    
    const user = await UserModel.findOne({ url: params.url })  
        .select<UserProfile>(
            'username bio uid box_color background_blur bg_color border_color border_style text_color border_width ' +
            'admin avatar socials banner effects autoplayfix autoplaymessage discord background opacity blur tilt ' +
            'user_layout user_badges custom_badges font width -_id'
        )      
        .lean<UserProfile>()
        .exec();

    if (!user) {
        return <div className='min-h-screen flex flex-col items-center justify-center'>
            <h1 className='font-bold text-2xl'>User not Found</h1>
            <LinkButton className='border-2 border-zinc-900 hover:border-none transition-colors duration-200 ease-in-out' href='/'>Go Home</LinkButton>
        </div>;
    }

    const sanitizedUser = {
        ...user,
        effects: {
            glow: user.effects?.glow || false,
            pfp_dec: user.effects?.pfp_dec  || '',
            background_dec: user.effects?.background_dec  || '',
        }
    };

    return (
        <>
            <link 
                rel="icon" 
                href={user.avatar || 'https://github.com/opium-bio/.github/blob/main/assets/outline.png?raw=true'} 
                sizes="any" 
            />
            <UserProfileClient user={sanitizedUser} />
        </>
    );
}
