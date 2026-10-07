import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


export async function POST(req: Request) {

    try {

        const body = await req.json();

        const {
            email,
            password
        } = body;


        if (!email || !password) {

            return NextResponse.json(
                {
                    error: "Email and password are required"
                },
                {
                    status:400
                }
            );

        }



        const user = await prisma.user.findUnique({

            where:{
                email
            }

        });



        if(!user){

            return NextResponse.json(
                {
                    error:"User not found"
                },
                {
                    status:404
                }
            );

        }



        if(!user.password){

            return NextResponse.json(
                {
                    error:"Invalid account"
                },
                {
                    status:400
                }
            );

        }



        const passwordMatch =
        await bcrypt.compare(
            password,
            user.password
        );



        if(!passwordMatch){

            return NextResponse.json(
                {
                    error:"Incorrect password"
                },
                {
                    status:401
                }
            );

        }



        return NextResponse.json({

            message:"Login successful",

            user:{
                id:user.id,
                name:user.name,
                email:user.email
            }

        });



    } catch(error){

        console.error("LOGIN ERROR:", error);


        return NextResponse.json(
            {
                error:"Server error"
            },
            {
                status:500
            }
        );

    }

}