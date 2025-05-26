document.addEventListener('DOMContentLoaded', () => {
    // Generate Table of Contents
    const toc = document.getElementById('toc');
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        // Get all headings in the section
        const headings = section.querySelectorAll('h2, h3, h4, h5');
        
        headings.forEach(heading => {
            // Generate an ID for the heading if it doesn't have one
            if (!heading.id) {
                heading.id = heading.textContent
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.textContent = heading.textContent;
            a.href = `#${heading.id}`;
            a.addEventListener('click', (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth' });
            });
            
            // Add appropriate indentation based on heading level
            const level = parseInt(heading.tagName.charAt(1)) - 2; // h2 = 0, h3 = 1, etc.
            li.style.paddingLeft = `${level * 20}px`;
            
            li.appendChild(a);
            toc.appendChild(li);
        });
    });

    // Add active state to TOC items on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active class from all TOC items
                document.querySelectorAll('#toc a').forEach(link => {
                    link.classList.remove('active');
                });
                
                // Add active class to current section's TOC item
                const activeLink = document.querySelector(`#toc a[href="#${entry.target.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }, observerOptions);

    // Observe all headings instead of just sections
    document.querySelectorAll('h2, h3, h4, h5').forEach(heading => {
        observer.observe(heading);
    });

    // Add copy button to code blocks
    document.querySelectorAll('pre code').forEach((block) => {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        
        const pre = block.parentNode;
        pre.style.position = 'relative';
        pre.appendChild(button);

        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(block.textContent);
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });
}); 