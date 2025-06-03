// ==UserScript==
// @name         Crunchyroll TV
// @namespace    https://github.com/xriss/monkey-magic
// @version      1.250603.2
// @description  Arrow key navigation of Crunchyroll site.
// @author       Qwyzz
// @match        https://*.crunchyroll.com/*
// @icon         data:image/gif;base64,R0lGODlhIAAgAPABAP///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCAABACwAAAAAIAAgAAACPYyPqcvtD6OctNqLs36g+w8CVEh6Y0meKIiVW+BusTZXa6jeXa7zd874ABfCSVFxjCQRy5fzCY1Kp9TqogAAOw==
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	document.head.appendChild(document.createElement("style")).innerHTML=`

/* hide the menu since we cant operate it */
	[class^='app-layout__header'] { display : none ; }
	.erc-browse-header { display : none ; }
	
/* let the player be as high as the screen */
	.video-player-spacer { max-height : 100vh !important ; }

/* hide the scrollbar so the video player can be as wide as the screen */
	html { scrollbar-width: none; }

	`
	
	let focus

// returns distance from element ae to be as [x,y]
	let getdist=function(ae,be)
	{
		let r=[0,0]
		if(!ae) // if ae is missing then we give distance of be from page origin
		{
			let br=be.getBoundingClientRect()
			return [window.scrollX+br.left,window.scrollY+br.top]
		}
		let ar=ae.getBoundingClientRect()
		let br=be.getBoundingClientRect()
		let xp=br.left - ar.right
		let xn=br.right - ar.left
		let yp=br.top - ar.bottom
		let yn=br.bottom - ar.top
		r[0]= ( xp>0 && xp ) || ( xn<0 && xn ) || 0
		r[1]= ( yp>0 && yp ) || ( yn<0 && yn ) || 0
		return r
	}

	let posinside=function(e,p)
	{
		let r=e.getBoundingClientRect()
		if( p[0] < window.scrollX+r.left   ) { return false }
		if( p[0] > window.scrollX+r.right  ) { return false }
		if( p[1] < window.scrollY+r.top    ) { return false }
		if( p[1] > window.scrollY+r.bottom ) { return false }
		return true
	}
	let getsiz=function(e)
	{
		let r=e.getBoundingClientRect()
		return Math.abs( (r.right-r.left) * (r.bottom-r.top) )
	}

	let getpos=function(e)
	{
		let r=e.getBoundingClientRect()
		let epos=[window.scrollX+((r.left+r.right)/2),window.scrollY+((r.top+r.bottom)/2)]
		return epos
	}
	let getmin=function(e)
	{
		let r=e.getBoundingClientRect()
		let epos=[r.left-((r.left+r.right)/2),r.top-((r.top+r.bottom)/2)]
		return epos
	}
	let getmax=function(e)
	{
		let r=e.getBoundingClientRect()
		let epos=[r.right-((r.left+r.right)/2),r.bottom-((r.top+r.bottom)/2)]
		return epos
	}

	let navi=function(dir)
	{

		// find all elements we might want to focus
		let es=Array.from(document.getElementsByTagName("a"))
		.concat( Array.from(document.getElementsByTagName("button")) )
		.concat( Array.from(document.getElementsByTagName("div")) )
		.filter(function(e){return e.getAttribute("tabindex")=="0"})
		.filter(function(e){return !e.classList.contains("as")})
		// remove some more dodgy ones
		for( let idx=es.length-1 ; idx>=0 ; idx-- )
		{
			let e=es[idx]
			let keep=true

			for (const v of e.classList.values() )
			{
				for( let s of
					[
					"user-menu",
					"menu-item",
					"erc-menu",
					"browse-menu",
					"browse-submenu",
					"carousel-arrow",
					"meta-tags",
					"star-rating",
					"dropdown",
					"carousel-pagination",
					"call-to-action",
					"hero-carousel",
				] )
				{
					if( v.startsWith(s) ) // these are invisible and muck up the navigation
					{
						keep=false
					}
				}

				for( let p=e.parentElement ; p.parentElement ; p=p.parentElement )
				{
					for (const v of p.classList.values() )
					{
						if( v.startsWith("header-") ) // keep away from header
						{
							keep=false
						}
					}
				}
			}
			if(!keep)
			{
				es.splice(idx,1)
			}
	   }
		// find current focus
		let best=null
		let best_dd=Number.MAX_VALUE
		for( let e of es)
		{
			let d=getdist(focus,e) // active element may be null
			let dd=d[0]*d[0]+d[1]*d[1]
			if( (!best) || (dd<best_dd) ) { best=e ; best_dd=dd }
		}

		let adjacent=function(dir,prp)
		{
			if(!best) { return }

			let getdir=function(a) { return a[0]*dir[0] + a[1]*dir[1] }
			let getprp=function(a) { return a[0]*prp[0] + a[1]*prp[1] }

			let adj=null
			let adj_dd=Number.MAX_VALUE
			for( let e of es)
			{
				if(e==best) { continue } // do not consider the current focus
				
				let d=getdist(best,e)
				let ddir=getdir(d)
				let dprp=getprp(d)
				
				if( ddir > 0 ) // MUST be in this direction
				{
					if( Math.abs(ddir)*2 >= Math.abs(dprp) ) // not too big an angle
					{
						if( Math.abs(ddir*dprp) <= Math.abs( window.innerWidth*window.innerHeight) ) // not too far a distance
						{
							let dd= Math.abs(ddir*ddir) + Math.abs(dprp*dprp*dprp)
							if( (!adj) || (dd<adj_dd) ) { adj=e ; adj_dd=dd }
						}
					}
				}
			}
			if(adj)
			{
				best=adj
			}
		}

		switch(dir)
		{
			case "left":
				scrollBy(-100,0)
				adjacent([-1, 0],[0,1])
			break;
			case "right":
				scrollBy(100,0)
				adjacent([ 1, 0],[0,1])
			break;
			case "up":
				scrollBy(0,-100)
				adjacent([ 0,-1],[1,0])
			break;
			case "down":
				scrollBy(0,100)
				adjacent([ 0, 1],[1,0])
			break;
		}

		if(best)
		{
			// dont select child elements?
/*
			for( let e of es)
			{
				if( posinside(e,getpos(best)) )
				{
					if( getsiz(e) > getsiz(best) )
					{
						best=e
					}
				}
			}
*/

//            console.log(best)
			if(best) { focus=best }
			if(focus)
			{
				focus.scrollIntoView({ behavior: "instant", block: "nearest", inline: "nearest" })
				focus.focus()
				setTimeout(function(){focus.focus()},100) // focus might not work immediately
			}
		}
	}
// need to listen for keys
	document.addEventListener("keydown", function(e) {
//        console.log(e)

		let mine=false

		let dir="none"
		if(e.code=="ArrowLeft")  { dir="left"  ; mine=true }
		if(e.code=="ArrowRight") { dir="right" ; mine=true }
		if(e.code=="ArrowUp")    { dir="up"    ; mine=true }
		if(e.code=="ArrowDown")  { dir="down"  ; mine=true }
		navi(dir)


		if( (e.code=="Escape") || (e.code=="Back")  )
		{
			mine=true
			history.back()
		}
		if( (e.code=="Enter")  || (e.code=="Space") )
		{
			mine=true
			if(focus) { focus.click() }
		}
		
		if(mine)
		{
			e.preventDefault()
			e.stopPropagation()
		}

})

})();
