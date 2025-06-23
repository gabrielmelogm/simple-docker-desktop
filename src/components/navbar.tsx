import { MenuIcon } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
	{ href: "/", label: "Home", active: window.location.pathname === "/" },
];

export function Navbar() {
	return (
		<header className="border-b px-4 md:px-6">
			<div className="flex h-16 justify-between gap-4">
				{/* Left side */}
				<div className="flex gap-2">
					<div className="flex items-center md:hidden">
						{/* Mobile menu trigger */}
						<Popover>
							<PopoverTrigger asChild>
								<Button className="group size-8" variant="ghost" size="icon">
									<MenuIcon />
								</Button>
							</PopoverTrigger>
							<PopoverContent align="start" className="w-36 p-1 md:hidden">
								<NavigationMenu className="max-w-none *:w-full">
									<NavigationMenuList className="flex-col items-start gap-0 md:gap-2">
										{navigationLinks.map((link) => (
											<NavigationMenuItem key={link.href} className="w-full">
												<NavigationMenuLink
													href={link.href}
													className="py-1.5"
													active={link.active}
												>
													{link.label}
												</NavigationMenuLink>
											</NavigationMenuItem>
										))}
									</NavigationMenuList>
								</NavigationMenu>
							</PopoverContent>
						</Popover>
					</div>
					{/* Main nav */}
					<div className="flex items-center gap-6">
						{/* Navigation menu */}
						<NavigationMenu className="h-full *:h-full max-md:hidden">
							<NavigationMenuList className="h-full gap-2">
								{navigationLinks.map((link) => (
									<NavigationMenuItem key={link.href} className="h-full">
										<NavigationMenuLink
											active={link.active}
											href={link.href}
											className="text-muted-foreground hover:text-primary border-b-primary hover:border-b-primary data-[active]:border-b-primary h-full justify-center rounded-none border-y-2 border-transparent py-1.5 font-medium hover:bg-transparent data-[active]:bg-transparent!"
										>
											{link.label}
										</NavigationMenuLink>
									</NavigationMenuItem>
								))}
							</NavigationMenuList>
						</NavigationMenu>
					</div>
				</div>
				{/* Right side */}
				<div className="flex items-center gap-2">
					<Button asChild variant="ghost" size="sm" className="text-sm">
						<Link to="/hello">Sign In</Link>
					</Button>
					<Button asChild size="sm" className="text-sm">
						<Link to="/hello">Get Started</Link>
					</Button>
				</div>
			</div>
		</header>
	);
}
