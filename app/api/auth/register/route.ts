import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";


export async function POST(req: Request) {

    try {

        const body = await req.json();

        const {
            name,
            email,
            password
        } = body;


        if (!name || !email || !password) {
            return NextResponse.json(
                {
                    error: "All fields are required"
                },
                {
                    status:400
                }
            );
        }


        const existingUser = await prisma.user.findUnique({
            where:{
                email
            }
        });


        if(existingUser){
            return NextResponse.json(
                {
                    error:"Email already exists"
                },
                {
                    status:400
                }
            );
        }


        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        const user = await prisma.user.create({

            data:{
                name,
                email,
                password:hashedPassword
            }

        });


        return NextResponse.json({

            message:"Account created successfully",
            user:{
                id:user.id,
                email:user.email
            }

        });


    } catch(error){

        console.error("REGISTER ERROR:", error);

        return NextResponse.json(
            {
                error:String(error)
            },
            {
                status:500
            }
        );

    }

}