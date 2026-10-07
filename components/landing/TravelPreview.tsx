import Image from "next/image";
import {
  MapPin,
  Calendar,
  Sparkles
} from "lucide-react";


export default function TravelPreview(){


return (

<div

className="
relative
rounded-3xl
bg-card
border
border-white/10
overflow-hidden
shadow-2xl
"

>


{/* Image */}

<div className="relative h-64">


<Image

src="/destinations/tokyo.jpg"

alt="Tokyo"

fill

sizes="(max-width: 768px) 100vw, 50vw"

priority

className="
object-cover
"

/>


<div

className="
absolute
inset-0
bg-gradient-to-t
from-card
to-transparent
"

/>


</div>



<div className="p-6">


<div

className="
flex
items-center
justify-between
"

>

<h3

className="
text-2xl
font-bold
text-white-soft
"

>

Tokyo Journey

</h3>


<span

className="
text-cyan
text-sm
"

>

AI Generated

</span>


</div>



<div

className="
mt-6
space-y-4
"

>


<div

className="
flex
gap-3
items-center
"

>

<MapPin className="text-violet"/>

<p className="text-gray-soft">

Tokyo, Japan

</p>

</div>



<div

className="
flex
gap-3
items-center
"

>

<Calendar className="text-cyan"/>

<p className="text-gray-soft">

7 Days Experience

</p>

</div>



<div

className="
flex
gap-3
items-center
"

>

<Sparkles className="text-violet"/>

<p className="text-gray-soft">

Culture Explorer DNA

</p>

</div>


</div>



<div

className="
mt-6
p-4
rounded-xl
bg-midnight
"

>

<p className="
text-cyan
font-semibold
">

AI Recommendation

</p>


<p

className="
mt-2
text-gray-soft
"

>

Optimized for food,
culture and photography.

</p>


</div>


</div>


</div>

)

}