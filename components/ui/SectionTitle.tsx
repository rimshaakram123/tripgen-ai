interface Props{

title:string;

subtitle?:string;

}


export default function SectionTitle({

title,

subtitle

}:Props){


return (

<div
className="
text-center
max-w-3xl
mx-auto
"

>


<h2

className="
text-4xl
font-bold
text-white-soft
"

>

{title}

</h2>


{

subtitle &&

<p

className="
mt-4
text-gray-soft
text-lg
"

>

{subtitle}

</p>

}


</div>

)

}